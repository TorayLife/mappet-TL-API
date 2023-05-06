type DumpedObject = {
	fields: MemberSet<Field>,
	methods: MemberSet<Method>,
	classStack: string[],
}
let dumpedObject: DumpedObject;
let lang;
let version = '1.0.0';

// @ts-ignore
function main(c) {
	Mappings.init();
	lang = new Localization(c);
	createDumpUI(c);
}

let lines = {
	'ru_RU': {
		description: 'Скрипт TL-Dump, версия ' + version +
			'\nЭтот скрипт позволяет смотреть поля и методы у любых объектов. Основная функция - автоматическая загрузка' +
			' деобфусцированных названий, которые отображаются справа. Если нажать по названию поля/метода справа - его' +
			' обфусцированная версия добавится в поле для вычисления. После нажатия кнопки Dump - списки обновятся для нового объекта.',
		listDescription: 'Список полей/методов (зависит от выбранного снизу режима).\nЛКМ по строке - добавит обфусцированное название' +
			' в поле для вычисления.\nОбратите внимание, что модификаторы \u00A77STATIC\u00A7r, \u00A7cPRIVATE\u00A7r,' +
			' \u00A74PROTECTED\u00A7r говорят о том, что поля/методы нельзя использовать из объекта напрямую.',
		proButton: 'Переключает отображение функций для продвинутых пользователей.',
		search: 'Искать',
		about: 'Справка',
		replLabel: 'Консоль/Лог',
		inputLabel: 'Поле для вычисления',
		inputPreviewLabel: 'Поле предпросмотра',
		pressMe: 'Нажми меня!',
	},
	'en_US': {
		description: 'Script TL-Dump, version ' + version +
			'\nThis script allows you to view fields and methods for any objects. The main function is automatic loading' +
			' deobfuscated names that are displayed on the right. If you click on the name of the field/method on the right - its' +
			' the obfuscated version will be added to the evaluation field. After clicking the Dump button, the lists will be updated for' +
			' the new object.',
		listDescription: 'List of fields/methods (depends on the mode selected below).\nLMB on name - the obfuscated version will' +
			' be added to the evaluation field.\nNote that modifiers \u00A77STATIC\u00A7r, \u00A7cPRIVATE\u00A7r,' +
			' \u00A74PROTECTED\u00A7r say that fields/methods cannot be used directly from the object.',
		proButton: 'Toggle visibility of the functions for advanced users.',
		search: 'Search',
		about: 'About',
		replLabel: 'Console/Log',
		inputLabel: 'Evaluation field',
		inputPreviewLabel: 'Preview field',
		pressMe: 'Press me!',
	},
};

class Localization {
	object: any;

	constructor(c: IScriptEvent) {
		let minecraftPlayer = c.player.minecraftPlayer;
		let field = minecraftPlayer.class.getDeclaredField('field_71148_cg'); //private 'language' field
		field.setAccessible(true);
		let lang = field.get(minecraftPlayer);
		this.object = lang == 'ru_ru' ? lines.ru_RU : lines.en_US;
	}


	get(key: string) {
		return this.object[key];
	}
}


class MemberSet<T extends Member> {
	registry: {
		[key: string]: T
	} = {};

	push(member: T) {
		this.registry[member.stringify(false)] = member;
	}

	filter(consumer: (member: T) => boolean): T[] {
		return Object.keys(this.registry).map(key => this.registry[key]).filter(value => consumer(value));
	}
}

function dump(object): DumpedObject {
	let output: DumpedObject = {
		fields: new MemberSet<Field>(),
		methods: new MemberSet<Method>(),
		classStack: [],
	};
	let clazz: any;
	if (object instanceof Java.type('jdk.internal.dynalink.beans.StaticClass') || object instanceof Java.type('java.lang.Class')) {
		clazz = object;
	}
	else {
		try {
			clazz = object.getClass();
		}
		catch (e) {
			clazz = null;
		}
	}

	if (clazz != null) {
		let name = clazz.getName();
		while (name != 'java.lang.Object') {
			for (let field of clazz.getDeclaredFields()) {
				output.fields.push(new Field(field));
			}

			for (let method of clazz.getDeclaredMethods()) {
				output.methods.push(new Method(method));
			}

			name = clazz.getName();
			output.classStack.unshift(name);
			clazz = clazz.getSuperclass();
		}
	}


	return output;
}

abstract class Member {
	name: string;
	type: string;
	modifiers: MemberModifier[];

	protected constructor(memberObject) {
		this.name = memberObject.getName();
		this.addModifiers(memberObject);
	}

	addModifiers(memberObject) {
		this.modifiers = [];
		let Modifier = Java.type('java.lang.reflect.Modifier');
		let modifiers = memberObject.getModifiers();

		if (Modifier.isStatic(modifiers)) {
			this.modifiers.push(MemberModifier.STATIC);
		}

		if (Modifier.isPrivate(modifiers)) {
			this.modifiers.push(MemberModifier.PRIVATE);
		}
		else if (Modifier.isProtected(modifiers)) {
			this.modifiers.push(MemberModifier.PROTECTED);
		}
		else if (!Modifier.isProtected(modifiers) && !Modifier.isPrivate(modifiers) && !Modifier.isPublic(modifiers)) {
			this.modifiers.push(MemberModifier.PACKAGE_PRIVATE);
		}
		//@ts-ignore
		if (Modifier.isFinal(modifiers)) {
			this.modifiers.push(MemberModifier.FINAL);
		}
	}

	isStaticOrNotPublic() {
		let modifiers = this.modifiers;
		let isStatic = false;
		let isPublic = true;
		for (let modifier of modifiers) {
			if (modifier == MemberModifier.STATIC) {
				isStatic = true;
				break;
			}
			if (modifier == MemberModifier.PRIVATE || modifier == MemberModifier.PACKAGE_PRIVATE || modifier == MemberModifier.PROTECTED) {
				isPublic = false;
				break;
			}
		}

		return !isStatic && isPublic;
	}

	abstract stringify(bool?: boolean);
}

class Field extends Member {

	constructor(memberObject: JavaField) {
		super(memberObject);
		this.type = memberObject.getType().getSimpleName();
	}

	stringify() {
		return this.type + ' ' + this.name;
	}
}

class Method extends Member {
	parameters: MethodParameter[] = [];

	constructor(memberObject: JavaMethod) {
		super(memberObject);
		this.type = memberObject.getReturnType().getSimpleName();
		let params: JavaClass[] = Java.from(memberObject.getParameterTypes());
		params.forEach(clazz => this.parameters.push(new MethodParameter(clazz)));
	}

	stringify(fullName: boolean) {
		let modifiersString = this.modifiers.length > 0 ? `\u00A7r[${this.modifiers.join('\u00A7r;')}\u00A7r]` : '';
		let returnString = this.type;
		let nameString = this.name;
		let parametersString = `(${this.parameters.map(p => fullName ? p.className : p.name).join(', ')})`;
		return `${modifiersString}${returnString} ${nameString}${parametersString}`;
	}
}

class MethodParameter {
	name: string;
	className: string;

	constructor(parameterClass: JavaClass) {
		this.className = parameterClass.getName();
		this.name = parameterClass.getSimpleName();
	}
}

enum MemberModifier {
	STATIC = '\u00A77STATIC',
	PRIVATE = '\u00A7cPRIVATE',
	PROTECTED = '\u00A74PROTECTED',
	PACKAGE_PRIVATE = '\u00A76PACKAGE-PRIVATE',
	FINAL = '\u00A76FINAL',
}

class Mappings {
	static mappingUrl = 'https://gist.githubusercontent.com/TorayLife/165840d8cca52bc25306dfc2ceb0c062/raw/2e48c3f257c4521122107a38ce2d6d0d6837df5d/1.12.2%2520mappings.txt';
	static url = Java.type('java.net.URL');
	static scanner = Java.type('java.util.Scanner');
	static mainDir = Java.type('net.minecraftforge.common.DimensionManager').getCurrentSaveRootDirectory().toPath();
	static path = Mappings.mainDir.resolve('mappet/scripts');

	static fileName = 'mappings-1_12_2.txt';

	static list = {};

	static init = () => {
		if (!Mappings.check()) {
			Mappings.downloadMappings();
		}

		if (!mappet.get('mappings')) {
			let file = Mappings.path.resolve(Mappings.fileName);
			let scanner = new Mappings.scanner(file);

			while (scanner.hasNext()) {
				let line = scanner.next().split(':');
				Mappings.list[line[0]] = line[1];
			}
			scanner.close();

			mappet.set('mappings', JSON.parse(JSON.stringify(Mappings.list)));
		}
		else {
			this.list = mappet.get('mappings');
		}
	};

	static downloadMappings = () => {
		let url = new Mappings.url(Mappings.mappingUrl);
		let scanner = new Mappings.scanner(url.openStream());
		let NioFiles = Java.type('java.nio.file.Files');

		let file = Mappings.path.resolve(Mappings.fileName);
		if (!NioFiles.exists(file)) {
			file = NioFiles.createFile(file);
		}

		let string = '';
		while (scanner.hasNext()) {
			string += scanner.next() + '\n';
		}
		// @ts-ignore
		NioFiles.write(file, string.getBytes());
		scanner.close();
	};

	static check = () => Java.type('java.nio.file.Files').exists(Mappings.path.resolve(Mappings.fileName));
}

let currentLayout = 'Fields';
let isPro = false;

function createDumpUI(c: IScriptEvent) {
	let root = mappet.createUI(c, 'handler').background();
	root.graphics().rx(0, 5).ry(0, 30).rw(0.55, -10).rh(0.34, -35).rect(0x88000000).rwh(1, 1);
	root.label(lang.get('replLabel')).rw(0.1).h(15).xy(5, 15).labelAnchor(0, 0.5).background(0x88000000);
	let replLogLayout = root.column(0);
	replLogLayout.current.scroll().rx(0, 10).ry(0, 35).rw(0.55, -15).rh(0.34, -45);
	replLogLayout.text('').rw(1).rh(1).id('replLog');

	root.label(lang.get('inputLabel')).rw(0.1).h(15).x(5).ry(0.33, 5).labelAnchor(0, 0.5).background(0x88000000);
	root.textarea().label('var player = c.player.minecraftPlayer; player').id('input').rx(0, 5).ry(0.33, 20)
		.rw(0.55, -10).rh(0.33, -5);
	new Callback('input').function = updatePreview;

	root.label(lang.get('inputPreviewLabel')).rw(0.1).h(15).x(5).ry(0.67, 15).labelAnchor(0, 0.5).background(0x88000000);
	root.graphics().anchorY(1).rx(0, 5).ry(1, -5).rw(0.55, -10).rh(0.33, -35).rect(0x88000000).rwh(1, 1);
	let textLayout = root.column(0);
	textLayout.current.anchorY(1).rx(0, 15).ry(1, -10).rw(0.55, -20).rh(0.33, -45);
	textLayout.current.scroll();
	textLayout.text('').id('inputPreview').rwh(1, 1);

	let buttonRow = root.row(4);
	buttonRow.current.anchor(1, 1).rx(1, -5).ry(1, -5).rw(0.45, -5).h(20);
	buttonRow.button('Dump').id('dumpButton').h(20);
	new Callback('dumpButton').setFunction(dumpPress);
	buttonRow.button('PRO: off').id('proButton').h(20).background(0x00FF44).tooltip(lang.get('proButton'));
	new Callback('proButton').setFunction((c: IScriptEvent) => {
		isPro = !isPro;
		(c.player.UIContext.get('proButton') as UIButtonComponent).background(isPro ? 0xFF6600 : 0x00FF44).label('Pro: ' + (isPro ? 'on' : 'off'));
		updateLists(c);
	});
	buttonRow.button('Fields').id('typeButton').h(20);
	new Callback('typeButton').function = function (c: IScriptEvent) {
		let context = c.player.UIContext;
		let otherId = currentLayout == 'Fields' ? 'Methods' : 'Fields';
		(context.get(context.last) as UIButtonComponent).label(otherId);
		context.get(currentLayout.toLowerCase() + 'Layout').visible(false);
		context.get(otherId.toLowerCase() + 'Layout').visible(true);
		currentLayout = otherId;
		context.sendToPlayer();
	};
	buttonRow.button('About').id('aboutButton').h(20);
	new Callback('aboutButton').function = function (c: IScriptEvent) {
		let context = c.player.UIContext;
		context.get('aboutScreen').visible(true);
	};

	let searchLayout = root.layout();
	searchLayout.current.rx(1, -5).ry(0, 5).anchorX(1).rw(0.45, -5).h(20);
	searchLayout.textbox().maxLength(999999).rw(0.8).h(20).id('search');
	searchLayout.button(lang.get('search')).rw(0.2).h(20).rx(0.8).id('searchButton');
	new Callback('searchButton').function = updateLists;

	root.label('').rx(1, -5).ry(0, 33).anchorX(1)
		.id('classNameLabel').rw(0.45, -5).h(15).background(0x88000000);

	let fieldsLayout = root.layout();
	fieldsLayout.current.rx(1, -5).ry(0, 45).anchorX(1).id('fieldsLayout').rw(0.45, -5).rh(1, -75);
	fieldsLayout.stringList([]).background().id('fieldsList').rwh(1, 1).tooltip(lang.get('listDescription'), 3);
	fieldsLayout.stringList([]).background().id('fieldsListObf').visible(false);
	new Callback('fieldsList').function = chooseMember;

	let methodsLayout = root.layout();
	methodsLayout.current.rx(1, -5).ry(0, 45).anchorX(1).id('methodsLayout').rw(0.45, -5).rh(1, -75).visible(false);
	methodsLayout.stringList([]).background().id('methodsList').rwh(1, 1).tooltip(lang.get('listDescription'), 3);
	methodsLayout.stringList([]).background().id('methodsListObf').visible(false);
	new Callback('methodsList').function = chooseMember;

	pressMeToast(root);
	aboutScreen(root);

	c.player.openUI(root, true);
}

function pressMeToast(root: IMappetUIBuilder) {
	let layout = root.layout();
	layout.current.rwh(1,1).id('pressMeLayout');
	let graphics = layout.graphics();
	let color = 0xffffffff;
	graphics.anchor(1, 1).rx(0.55, 15).ry(1, -35).rw(0.15, -5).h(30);
	graphics.shadow(color, 0xff000000, 2).rwh(1,1);
	let step = 1;
	let initialWidth = 8;
	let xOffset = -2;
	for (let i = initialWidth; i > 0; i-=step) {
		graphics.rect(color).wh(i, step).rx(1, -i + xOffset).ry(1, initialWidth - i);
	}
	layout.label(lang.get('pressMe')).wh(100,15).ry(1, -60).rx(0.4, 25).color(0x000000, false);
}

function aboutScreen(root: IMappetUIBuilder) {
	let layout = root.layout();
	layout.current.id('aboutScreen').rwh(1, 1).visible(false);

	let graphics = layout.graphics().rwh(1, 1);
	graphics.rect(0x88000000).rwh(1, 1);
	graphics.shadow(0x880088FF, 0x000088FF, 5).rwh(0.5, 0.5).rxy(0.25, 0.25);
	graphics.rect(0xff000000).rwh(0.5, 0.5).rxy(0.25, 0.25);
	layout.button('').noBackground().rwh(1, 1).tooltip('\u00A70 ');
	let textLayout = layout.column(0);
	textLayout.current.rwh(0.45, 0.45).rxy(0.5, 0.5).anchor(0.5);
	textLayout.text('\u00A77' + lang.get('description')).rwh(0.8, 0.8).rxy(0.5, 0.5).textAnchor(0.5).anchor(0.5);
	layout.icon('close').id('closeIcon').anchor(1, 1).wh(20, 20).rx(0.75).ry(0.25, 20);
	new Callback('closeIcon').function = function (c: IScriptEvent) {
		let context = c.player.UIContext;
		context.get('aboutScreen').visible(false);
	};
}

function chooseMember(c: IScriptEvent) {
	let context = c.player.UIContext;

	if (context.data.getString('input') == '') {
		return;
	}

	let obf = (context.get(context.last + 'Obf') as UIStringListComponent).getValues()[context.data.getInt(context.last + '.index')];
	let memberName = obf.substring(obf.indexOf(' ') + 1, obf.length);

	let inputString = context.data.getString('input');

	let finalString = inputString + '.' + memberName;
	context.data.setString('input', finalString);
	(context.get('input') as UITextareaComponent).label(finalString);
	updatePreview(c);
	context.sendToPlayer();
}

function updatePreview(c: IScriptEvent) {
	let context = c.player.UIContext;
	(context.get('inputPreview') as UITextComponent).label(deobfuscateString(context.data.getString('input'), true));
}

function deobfuscateString(string: string, mark: boolean = false): string {
	let regexp = /(field|func)_\d{5,6}_[a-zA-Z]{1,2}_?/gm;
	let prefix = mark ? '\u00A76' : '';
	let postfix = mark ? '\u00A7r' : '';
	return string.replace(regexp, (obf) => prefix + Mappings.list[obf] + postfix);
}

function dumpPress(c: IScriptEvent) {
	let context = c.player.UIContext;
	let data = context.data;

	context.get('pressMeLayout').visible(false);

	if (!data.getString('input')) {
		return;
	}

	let print = (...objects) => {
		let string = '';
		objects.forEach(obj => string += obj + '\n');
		let newString = data.getString('replLog') + string;
		(context.get('replLog') as UITextComponent).label(newString);
		data.setString('replLog', newString);
	};
	try {
		let object = eval(data.getString('input'));
		dumpedObject = dump(object);
		print(object);
	}
	catch (err) {
		print(err);
	}
	(context.get('classNameLabel') as UILabelComponent).label(dumpedObject.classStack[dumpedObject.classStack.length - 1])
													   .tooltip(dumpedObject.classStack.join('\n'));
	updateLists(c);
}

function updateLists(c: IScriptEvent) {
	let context = c.player.UIContext;
	(context.get('fieldsListObf') as UIStringListComponent).values(['']);
	(context.get('methodsListObf') as UIStringListComponent).values(['']);
	(context.get('fieldsList') as UIStringListComponent).values(['']);
	(context.get('methodsList') as UIStringListComponent).values(['']);

	updatePreview(c);

	let searchValue = context.data.getString('search');

	let fields: { obf: string, deobf: string }[] =
		dumpedObject.fields
					.filter(f => {
						if (isPro) {
							return true;
						}
						return f.isStaticOrNotPublic();
					})
					.map(f => {
						return {
							obf: f.stringify(),
							deobf: deobfuscateString(f.stringify()),
						};
					});

	let methods: { obf: string, deobf: string }[] =
		dumpedObject.methods
					.filter(f => {
						if (isPro) {
							return true;
						}
						return f.isStaticOrNotPublic();
					})
					.map(f => {
						return {
							obf: f.stringify(true),
							deobf: deobfuscateString(f.stringify(false)),
						};
					});

	if (searchValue) {
		fields = fields.filter(f => f.deobf.indexOf(searchValue) !== -1);
		methods = methods.filter(f => f.deobf.indexOf(searchValue) !== -1);
	}

	if (fields.length > 0) {
		(context.get('fieldsListObf') as UIStringListComponent).values(fields.map(f => f.obf));
		(context.get('fieldsList') as UIStringListComponent).values(fields.map(f => f.deobf));
	}

	if (methods.length > 0) {
		(context.get('methodsListObf') as UIStringListComponent).values(methods.map(m => m.obf));
		(context.get('methodsList') as UIStringListComponent).values(methods.map(m => m.deobf));
	}
}
