/*! TL-Tasks
 * Version: 0.1.0
 * https://github.com/TorayLife/mappet-TL-API/tree/master/TL-Tasks
 * Made by Dyamo (https://github.com/dyam0)
 */

type NonUndefined<T> = T extends undefined ? never : T;

abstract class Task<P extends NonUndefined<any>, R extends NonUndefined<any>> {
    protected static Executors = Java.type('java.util.concurrent.Executors');
    protected static TimeUnit = Java.type('java.util.concurrent.TimeUnit');


    static UNLIMITED_LOOP = -42
    static executorService = Task.Executors.newScheduledThreadPool(3);


    protected nextTask: Task<R, any> | null = null;
    abstract result: R


    then<N>(fn: (task: Task<R, N>) => N, delay: number = 0): Task<R, N> {
        this.nextTask = new DelayedTask<R, N>(fn, delay, false);
        return this.nextTask;
    }

    thenLooped<N>(fn: (task: Task<R, N>) => N, delay: number = 0, count: number = 1, initDelay: number = delay): Task<R, N> {
        this.nextTask = new LoopedTask<R, N>(fn, delay, count, initDelay, false);
        return this.nextTask;
    }

    cancel() {
        this.nextTask = null;
    }


    abstract start()


    static run<P, R>(fn: (task: Task<P, R>) => R, delay: number = 0): Task<P, R> {
        return new DelayedTask<P, R>(fn, delay);
    }

    static runLooped<P, R>(fn: (task: Task<P, R>) => R, delay: number = 0, count: number = 1, initDelay: number = delay): Task<P, R> {
        return new LoopedTask<P, R>(fn, delay, count, initDelay);
    }


    protected static makeRunnable(fn: () => void) {
        return new (Java.extend(Java.type('java.lang.Runnable'), {
            run: fn,
        }));
    }
}

class DelayedTask<P extends NonUndefined<any>, R extends NonUndefined<any>> extends Task<P, R> {
    result: R;

    constructor(
        private readonly fn: (task: Task<P | undefined, R>) => R,
        private readonly delay: number = 0,
        isFirst: boolean = true
    ) {
        super();
        if (isFirst) {
            this.start();
        }
    }

    start() {
        Task.executorService.schedule(Task.makeRunnable(() => {
            let result;
            try {
                result = this.fn(this);
            } catch (error) {
                this.cancel();
            }

            if (this.nextTask !== null) {
                this.nextTask.result = result;
                this.nextTask.start();
            }
        }), this.delay, Task.TimeUnit.MILLISECONDS);
    }
}


class LoopedTask<P extends NonUndefined<any>, R extends NonUndefined<any>> extends Task<P, R> {
    result: R;
    index: number = 0;
    private isBroken: boolean = false;

    constructor(
        private readonly fn: (task: Task<P | undefined, R>) => R,
        private readonly delay: number = 0,
        private readonly iterationCount: number = 0,
        private readonly initDelay: number = 0,
        isFirst: boolean = true
    ) {
        super();
        if (isFirst) {
            this.start();
        }
    }

    break() {
        this.isBroken = true;
    }

    start() {
        if (this.iterationCount <= 0 && this.iterationCount != Task.UNLIMITED_LOOP) return;

        let future = Task.executorService.scheduleWithFixedDelay(() => {
            try {
                this.result = this.fn(this);
            } catch (error) {
                this.cancel();
                future.cancel();
            }

            this.index++;

            if ((this.index >= this.iterationCount && this.iterationCount != Task.UNLIMITED_LOOP) || this.isBroken) {
                if (this.nextTask !== null) {
                    this.nextTask.result = this.result;
                    this.nextTask.start();
                }
                future.cancel();
            }
        }, this.initDelay, this.delay, Task.TimeUnit.MILLISECONDS);
    }
}