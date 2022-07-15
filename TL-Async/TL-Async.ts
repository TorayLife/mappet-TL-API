abstract class Async {
	static JTimer = Java.type('java.util.Timer');
	static JTimerTask = Java.type('java.util.TimerTask');
	static JPhaser = Java.type('java.util.concurrent.Phaser');
	static JTimeUnit = Java.type('java.util.concurrent.TimeUnit');
	static timer = new Async.JTimer('loop', false);
	static phaser = new Async.JPhaser();

	static results;
	static tasks = {};

	private static async() {
		Async.phaser.register();

		return function (err, result) {
			Async.results = {err: err, result: result};
			Async.phaser.arriveAndDeregister();
		};
	};

	private static setTimeout(fn, millis) {
		Async.phaser.register();

		let task = new Async.JTimerTask({
			run: function () {
				try {
					fn();
				} finally {
					Async.phaser.arriveAndDeregister();
				}
			},
		});

		Async.timer.schedule(task, millis || 0);

		return task;
	}

	private static setInterval(fn, millis) {
		Async.phaser.register();

		var task = new Async.JTimerTask({
			run: function (){
				fn();
			}
		});

		Async.timer.scheduleAtFixedRate(task, millis, millis);

		return task;
	}

	private static clearInterval(task) {
		if (task.cancel()) {
			Async.phaser.arriveAndDeregister();
		}
	}

	public static setTask(taskName:string, fn:()=>any, millis:number = 0, repeat:boolean = false){

		let done = Async.async();

		let func = () => {
			try{
				fn();
			}
			catch (err) {

			}
			done(null, 'WORK DONE!');
			Async.tasks[taskName] = null;
		}

		let task = repeat ? Async.setInterval(func, millis) : Async.setTimeout(func, millis);

		if(millis > 0){
			Async.phaser.awaitAdvanceInterruptibly(Async.phaser.arrive(), millis, Async.JTimeUnit.MILLISECONDS);
		}
		else{
			Async.phaser.awaitAdvanceInterruptibly(Async.phaser.arrive());
		}


		Async.tasks[taskName] = task;

		return task;
	}

	public static cancelTask(taskName:string){
		if(Async.tasks[taskName]){
			Async.clearInterval(Async.tasks[taskName]);
			Async.tasks[taskName] = null;
		}
	}
}