/*! TL-Tasks
 * Version: 0.0.1
 * https://github.com/TorayLife/mappet-TL-API/tree/master/TL-Tasks
 * Made by Dyamo (https://github.com/dyam0)
 */

type NonUndefined<T> = T extends undefined ? never : T;

class Task<P extends NonUndefined<any>, R extends NonUndefined<any>> {
	static Executors = Java.type('java.util.concurrent.Executors');
	static TimeUnit = Java.type('java.util.concurrent.TimeUnit');

	static executorService = Task.Executors.newScheduledThreadPool(3);

	private nextTask: Task<R, any> | null = null;

	private constructor(private readonly fn: (result: P | undefined) => R, private readonly delay: number = 0, isFirst: boolean = true) {
		if (isFirst) {
			this.start(undefined);
		}
	}

	then<N>(fn: (result: R) => N, delay: number = 0): Task<R, N> {
		this.nextTask = new Task<R, N>(fn, delay, false);
		return this.nextTask;
	}

	private start(previousResult: P | undefined) {
		Task.executorService.schedule(Task.makeRunnable(() => {
			let result = this.fn(previousResult);
			this.nextTask?.start(result);
		}), this.delay, Task.TimeUnit.MILLISECONDS);
	}

	static define<P, R>(fn: () => R, delay: number = 0): Task<P, R> {
		return new Task<P, R>(fn, delay);
	}

	private static makeRunnable(fn: () => void) {
		return new (Java.extend(Java.type('java.lang.Runnable'), {
			run: fn,
		}));
	}
}