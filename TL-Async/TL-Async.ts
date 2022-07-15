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
		this.phaser.register();

		return function (err, result) {
			this.results = {err: err, result: result};
			this.phaser.arriveAndDeregister();
		};
	};

	private static setTimeout(fn, millis) {
		this.phaser.register();

		let task = new Async.JTimerTask({
			run: function () {
				try {
					fn();
				} finally {
					Async.phaser.arriveAndDeregister();
				}
			},
		});

		this.timer.schedule(task, millis || 0);

		return task;
	}

	private static setInterval(fn, millis) {
		this.phaser.register();

		var task = new this.JTimerTask({
			run: function (){
				fn();
			}
		});

		this.timer.scheduleAtFixedRate(task, millis, millis);

		return task;
	}

	private static clearInterval(task) {
		if (task.cancel()) {
			Async.phaser.arriveAndDeregister();
		}
	}

	public static setTask(taskName:string, fn:()=>any, millis:number = 0, repeat:boolean = false){

		let done = this.async();

		let func = () => {
			try{
				fn();
			}
			catch (err) {

			}
			done(null, 'WORK DONE!');
			this.tasks[taskName] = null;
		}

		let task = repeat ? this.setInterval(func, millis) : this.setTimeout(func, millis);

		if(millis > 0){
			this.phaser.awaitAdvanceInterruptibly(this.phaser.arrive(), millis, this.JTimeUnit.MILLISECONDS);
		}
		else{
			this.phaser.awaitAdvanceInterruptibly(this.phaser.arrive());
		}


		this.tasks[taskName] = task;

		return task;
	}

	public static cancelTask(taskName:string){
		if(this.tasks[taskName]){
			this.clearInterval(this.tasks[taskName]);
			this.tasks[taskName] = null;
		}
	}
}