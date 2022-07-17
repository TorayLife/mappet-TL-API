var Task = /** @class */ (function () {
    function Task(fn, delay, isFirst) {
        if (delay === void 0) { delay = 0; }
        if (isFirst === void 0) { isFirst = true; }
        this.fn = fn;
        this.delay = delay;
        this.nextTask = null;
        if (isFirst) {
            this.start(undefined);
        }
    }
    Task.prototype.then = function (fn, delay) {
        if (delay === void 0) { delay = 0; }
        this.nextTask = new Task(fn, delay, false);
        return this.nextTask;
    };
    Task.prototype.start = function (previousResult) {
        var _this = this;
        Task.executorService.schedule(Task.makeRunnable(function () {
            var _a;
            var result = _this.fn(previousResult);
            (_a = _this.nextTask) === null || _a === void 0 ? void 0 : _a.start(result);
        }), this.delay, Task.TimeUnit.MILLISECONDS);
    };
    Task.define = function (fn, delay) {
        if (delay === void 0) { delay = 0; }
        return new Task(fn, delay);
    };
    Task.makeRunnable = function (fn) {
        return new (Java.extend(Java.type('java.lang.Runnable'), {
            run: fn,
        }));
    };
    Task.Executors = Java.type('java.util.concurrent.Executors');
    Task.TimeUnit = Java.type('java.util.concurrent.TimeUnit');
    Task.executorService = Task.Executors.newScheduledThreadPool(3);
    return Task;
}());
