/*! TL-Tasks
 * Version: 0.0.2
 * https://github.com/TorayLife/mappet-TL-API/tree/master/TL-Tasks
 * Made by Dyamo (https://github.com/dyam0)
 */

type NonUndefined<T> = T extends undefined ? never : T;

class Task<P extends NonUndefined<any>, R extends NonUndefined<any>> {
	private static Executors = Java.type('java.util.concurrent.Executors');
	private static TimeUnit = Java.type('java.util.concurrent.TimeUnit');
	static executorService = Task.Executors.newScheduledThreadPool(3);

	private nextTask: Task<R, any> | null = null;
	result: R;

	private constructor(private readonly fn: (task: Task<P | undefined, R>) => R, private readonly delay: number = 0, isFirst: boolean = true) {
		if (isFirst) {
			this.start(undefined);
		}
	}

	then<N>(fn: (task: Task<R, N>) => N, delay: number = 0): Task<R, N> {
		this.nextTask = new Task<R, N>(fn, delay, false);
		return this.nextTask;
	}

	cancel() {
		this.nextTask = null;
	}

	private start(previousResult: P | undefined) {
		Task.executorService.schedule(Task.makeRunnable(() => {
			let result;
			try {
				result = this.fn(this);
			} catch (error) {}

			if (this.nextTask !== null && result !== null) {
				this.nextTask.result = result;
				this.nextTask.start(result);
			}
		}), this.delay, Task.TimeUnit.MILLISECONDS);
	}

	static define<P, R>(fn: (task: Task<P, R>) => R, delay: number = 0): Task<P, R> {
		return new Task<P, R>(fn, delay);
	}

	private static makeRunnable(fn: () => void) {
		return new (Java.extend(Java.type('java.lang.Runnable'), {
			run: fn,
		}));
	}
}