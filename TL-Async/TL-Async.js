var Async = /** @class */ (function () {
    function Async() {
    }
    Async.async = function () {
        Async.phaser.register();
        return function (err, result) {
            Async.results = { err: err, result: result };
            Async.phaser.arriveAndDeregister();
        };
    };
    ;
    Async.setTimeout = function (fn, millis) {
        Async.phaser.register();
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
        Async.timer.schedule(task, millis || 0);
        return task;
    };
    Async.setInterval = function (fn, millis) {
        Async.phaser.register();
        var task = new Async.JTimerTask({
            run: function () {
                fn();
            }
        });
        Async.timer.scheduleAtFixedRate(task, millis, millis);
        return task;
    };
    Async.clearInterval = function (task) {
        if (task.cancel()) {
            Async.phaser.arriveAndDeregister();
        }
    };
    Async.setTask = function (taskName, fn, millis, repeat) {
        if (millis === void 0) { millis = 0; }
        if (repeat === void 0) { repeat = false; }
        var done = Async.async();
        var func = function () {
            try {
                fn();
            }
            catch (err) {
            }
            done(null, 'WORK DONE!');
            Async.tasks[taskName] = null;
        };
        var task = repeat ? Async.setInterval(func, millis) : Async.setTimeout(func, millis);
        if (millis > 0) {
            Async.phaser.awaitAdvanceInterruptibly(Async.phaser.arrive(), millis, Async.JTimeUnit.MILLISECONDS);
        }
        else {
            Async.phaser.awaitAdvanceInterruptibly(Async.phaser.arrive());
        }
        Async.tasks[taskName] = task;
        return task;
    };
    Async.cancelTask = function (taskName) {
        if (Async.tasks[taskName]) {
            Async.clearInterval(Async.tasks[taskName]);
            Async.tasks[taskName] = null;
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
