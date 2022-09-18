/*! TL-Tasks
 * Version: 0.1.0
 * https://github.com/TorayLife/mappet-TL-API/tree/master/TL-Tasks
 * Made by Dyamo (https://github.com/dyam0)
 */

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();

var Task = /** @class */ (function () {
    function Task() {
        this.nextTask = null;
    }
    Task.prototype.then = function (fn, delay) {
        if (delay === void 0) { delay = 0; }
        this.nextTask = new DelayedTask(fn, delay, false);
        return this.nextTask;
    };
    Task.prototype.thenLooped = function (fn, delay, count, initDelay) {
        if (delay === void 0) { delay = 0; }
        if (count === void 0) { count = 1; }
        if (initDelay === void 0) { initDelay = delay; }
        this.nextTask = new LoopedTask(fn, delay, count, initDelay, false);
        return this.nextTask;
    };
    Task.prototype.cancel = function () {
        this.nextTask = null;
    };
    Task.run = function (fn, delay) {
        if (delay === void 0) { delay = 0; }
        return new DelayedTask(fn, delay);
    };
    Task.runLooped = function (fn, delay, count, initDelay) {
        if (delay === void 0) { delay = 0; }
        if (count === void 0) { count = 1; }
        if (initDelay === void 0) { initDelay = delay; }
        return new LoopedTask(fn, delay, count, initDelay);
    };
    Task.makeRunnable = function (fn) {
        return new (Java.extend(Java.type('java.lang.Runnable'), {
            run: fn,
        }));
    };
    Task.Executors = Java.type('java.util.concurrent.Executors');
    Task.TimeUnit = Java.type('java.util.concurrent.TimeUnit');
    Task.UNLIMITED_LOOP = -42;
    Task.executorService = Task.Executors.newScheduledThreadPool(3);
    return Task;
}());

var DelayedTask = /** @class */ (function (_super) {
    __extends(DelayedTask, _super);
    function DelayedTask(fn, delay, isFirst) {
        if (delay === void 0) { delay = 0; }
        if (isFirst === void 0) { isFirst = true; }
        var _this = _super.call(this) || this;
        _this.fn = fn;
        _this.delay = delay;
        if (isFirst) {
            _this.start();
        }
        return _this;
    }
    DelayedTask.prototype.start = function () {
        var _this = this;
        Task.executorService.schedule(Task.makeRunnable(function () {
            var result;
            try {
                result = _this.fn(_this);
            }
            catch (error) {
                _this.cancel();
            }
            if (_this.nextTask !== null) {
                _this.nextTask.result = result;
                _this.nextTask.start();
            }
        }), this.delay, Task.TimeUnit.MILLISECONDS);
    };
    return DelayedTask;
}(Task));

var LoopedTask = /** @class */ (function (_super) {
    __extends(LoopedTask, _super);
    function LoopedTask(fn, delay, iterationCount, initDelay, isFirst) {
        if (delay === void 0) { delay = 0; }
        if (iterationCount === void 0) { iterationCount = 0; }
        if (initDelay === void 0) { initDelay = 0; }
        if (isFirst === void 0) { isFirst = true; }
        var _this = _super.call(this) || this;
        _this.fn = fn;
        _this.delay = delay;
        _this.iterationCount = iterationCount;
        _this.initDelay = initDelay;
        _this.index = 0;
        _this.isBroken = false;
        if (isFirst) {
            _this.start();
        }
        return _this;
    }
    LoopedTask.prototype.break = function () {
        this.isBroken = true;
    };
    LoopedTask.prototype.start = function () {
        var _this = this;
        if (this.iterationCount <= 0 && this.iterationCount != Task.UNLIMITED_LOOP)
            return;
        var future = Task.executorService.scheduleWithFixedDelay(function () {
            try {
                _this.result = _this.fn(_this);
            }
            catch (error) {
                _this.cancel();
                future.cancel();
            }
            _this.index++;
            if ((_this.index >= _this.iterationCount && _this.iterationCount != Task.UNLIMITED_LOOP) || _this.isBroken) {
                if (_this.nextTask !== null) {
                    _this.nextTask.result = _this.result;
                    _this.nextTask.start();
                }
                future.cancel();
            }
        }, this.initDelay, this.delay, Task.TimeUnit.MILLISECONDS);
    };
    return LoopedTask;
}(Task));
