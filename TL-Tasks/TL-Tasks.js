/*! TL-Tasks
 * Version: 0.0.2
 * https://github.com/TorayLife/mappet-TL-API/tree/master/TL-Tasks
 * Made by Dyamo (https://github.com/dyam0)
 */
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
    Task.prototype.cancel = function () {
        this.nextTask = null;
    };
    Task.prototype.start = function (previousResult) {
        var _this = this;
        Task.executorService.schedule(Task.makeRunnable(function () {
            var result;
            try {
                result = _this.fn(_this);
            }
            catch (error) { }
            if (_this.nextTask !== null && result !== null) {
                _this.nextTask.result = result;
                _this.nextTask.start(result);
            }
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
