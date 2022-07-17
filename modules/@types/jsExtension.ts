
declare interface String {
	startsWith(subString:String):boolean;
}

declare interface Array<T> {
	toString():string;
}

//#region STRING
String.prototype.startsWith = function(subString:string){
    return true;
}


//#endregion STRING

//#region ARRAY



//#endregion ARRAY



abstract class Java {

	static type(str:string):any{}
	static extend(type:any, object:object):any{}
	static from<T>(any: T[]):T[]{return any;}
}