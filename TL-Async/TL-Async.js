var Async = /** @class */ (function () {
    function Async() {
    }
    Async.async = function () {
        this.phaser.register();
        return function (err, result) {
            this.results = { err: err, result: result };
            this.phaser.arriveAndDeregister();
        };
    };
    ;
    Async.setTimeout = function (fn, millis) {
        this.phaser.register();
        var task = new Async.JTimerTask({
            run: function () {
                try {
                    fn();
                }
                finally {
                    Async.phaser.arriveAndDeregister();
                }
            },
        });
        this.timer.schedule(task, millis || 0);
        return task;
    };
    Async.setInterval = function (fn, millis) {
        this.phaser.register();
        var task = new this.JTimerTask({
            run: function () {
                fn();
            }
        });
        this.timer.scheduleAtFixedRate(task, millis, millis);
        return task;
    };
    Async.clearInterval = function (task) {
        if (task.cancel()) {
            Async.phaser.arriveAndDeregister();
        }
    };
    Async.setTask = function (taskName, fn, millis, repeat) {
        var _this = this;
        if (millis === void 0) { millis = 0; }
        if (repeat === void 0) { repeat = false; }
        var done = this.async();
        var func = function () {
            try {
                fn();
            }
            catch (err) {
            }
            done(null, 'WORK DONE!');
            _this.tasks[taskName] = null;
        };
        var task = repeat ? this.setInterval(func, millis) : this.setTimeout(func, millis);
        if (millis > 0) {
            this.phaser.awaitAdvanceInterruptibly(this.phaser.arrive(), millis, this.JTimeUnit.MILLISECONDS);
        }
        else {
            this.phaser.awaitAdvanceInterruptibly(this.phaser.arrive());
        }
        this.tasks[taskName] = task;
        return task;
    };
    Async.cancelTask = function (taskName) {
        if (this.tasks[taskName]) {
            this.clearInterval(this.tasks[taskName]);
            this.tasks[taskName] = null;
        }
    };
    Async.JTimer = Java.type('java.util.Timer');
    Async.JTimerTask = Java.type('java.util.TimerTask');
    Async.JPhaser = Java.type('java.util.concurrent.Phaser');
    Async.JTimeUnit = Java.type('java.util.concurrent.TimeUnit');
    Async.timer = new Async.JTimer('loop', false);
    Async.phaser = new Async.JPhaser();
    Async.tasks = {};
    return Async;
}());
