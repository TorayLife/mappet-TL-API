class Callback {
	static registry = {};
	component: UIComponent;
	function: Function = () => {};

	constructor(id:string) {
		// @ts-ignore
		Callback.registry[id] = this;
		return Callback.registry[id];
	}

	setFunction(func: Function) {
		this.function = func;
		return this;
	}

	static handler(c: IScriptEvent){
		let context = c.player.UIContext;
		let last = context.last;
		if (last && Callback.registry[last]) {
			let callback = Callback.registry[last];
			callback.function(c, last);
		}
		if (!context.isClosed() && last == '' && context.context && Callback.registry[context.context]) {
			let callback = Callback.registry[context.context];
			callback.function(c, last);
		}
	}
}

function handler(c){
	Callback.handler(c);
}