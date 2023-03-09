var Callback = /** @class */ (function () {
    function Callback(id) {
        this.function = function () { };
        // @ts-ignore
        Callback.registry[id] = this;
        return Callback.registry[id];
    }
    Callback.prototype.setFunction = function (func) {
        this.function = func;
        return this;
    };
    Callback.handler = function (c) {
        var context = c.player.UIContext;
        var last = context.last;
        if (last && Callback.registry[last]) {
            var callback = Callback.registry[last];
            callback.function(c, last);
        }
        if (last == '' && context.context && Callback.registry[context.context]) {
            var callback = Callback.registry[context.context];
            callback.function(c, last);
        }
    };
    Callback.registry = {};
    return Callback;
}());
function handler(c) {
    Callback.handler(c);
}
