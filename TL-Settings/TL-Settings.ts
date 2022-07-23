/*! TL-Settings
 * Version: 0.0.1
 * https://github.com/TorayLife/mappet-TL-API/tree/master/TL-Settings
 * Made by TorayLife (https://github.com/TorayLife)
 */

let ColorMC = {
	BLACK: ['0', '000000'],
	DARK_BLUE: ['1', '0000AA'],
	DARK_GREEN: ['2', '00AA00'],
	DARK_AQUA: ['3', '00AAAA'],
	DARK_RED: ['4', 'AA0000'],
	DARK_PURPLE: ['5', 'AA00AA'],
	GOLD: ['6', 'FFAA00'],
	GRAY: ['7', 'AAAAAA'],
	DARK_GRAY: ['8', '555555'],
	BLUE: ['9', '5555FF'],
	GREEN: ['a', '55FF55'],
	AQUA: ['b', '55FFFF'],
	RED: ['c', 'FF5555'],
	LIGHT_PURPLE: ['d', 'FF55FF'],
	YELLOW: ['e', 'FFFF55'],
	WHITE: ['f', 'FFFFFF'],
};

enum SettingType {
	BOOLEAN,
	INTEGER,
	DOUBLE,
	STRING,
	COLOR_RGB,
	COLOR_ARGB,
	COLOR_MC,
	ENUM,
	POS,
	ARRAY,
	PARAGRAPH,
}

class SettingStorage {
	registry: {};
	file: any;
	script: string;
	static settingDirectory: string = 'settings';

	constructor(fileName: string, init:boolean = true) {
		this.script = fileName;
		this.registry = {};
		if(init) {
			SettingStorage.initGlobalSettings();
		}
		if(SettingStorage.settingDirectory == ''){
			SettingStorage.settingDirectory = 'settings';
		}
		this.initFile(fileName == 'globalSettings' ? '' : SettingStorage.settingDirectory, fileName);
		this.load();
	}

	initFile(directory:string, fileName:string){
		if (!FileLib.has(directory, `${fileName}.json`)) {
			FileLib.create(directory, `${fileName}.json`);
		}

		this.file = FileLib.get(directory, `${fileName}.json`);
	}

	static initGlobalSettings(){
		if (!FileLib.has('', `globalSettings.json`)) {
			FileLib.create('', `globalSettings.json`);
		}
		SettingStorage.settingDirectory = '';
		let storage = new SettingStorage('globalSettings', false);
		SettingStorage.settingDirectory = storage.get('settingDirectory', 'Setting directory', 'Folder that uses by script to storage' +
			' settings', SettingType.STRING, 'settings');
	}


	get(systemLabel: string, label: string, description: string, type: SettingType, value: any, additionalData: any = null): any {
		let fullId = `Setting.${this.script}.${systemLabel}`;
		if (this.has(fullId)) {
			if (this.registry[fullId].type != type) {
				throw `Setting ${fullId}'s has another type: ${SettingType[this.registry[fullId].type]} : ${SettingType[type]}`;
			}
			this.registry[fullId].label = label;
			this.registry[fullId].description = description;
			this.registry[fullId].additionalData = additionalData;
			this.save();
			return this.registry[fullId].getValue();
		}
		else {
			let data = {
				systemLabel: systemLabel,
				storage: this,
				label: label,
				scriptName: this.script,
				description: description,
				type: type,
				value: value,
				defaultValue: value,
				additionalData: additionalData,

			};
			let setting = this.createSetting(data);
			this.save();
			return setting.value;
		}
	}

	save() {
		let obj = this.registry;
		let keys = Object.keys(obj);
		let output = {};
		for (let i of keys) {
			output[i] = obj[i].serialize();
		}
		FileLib.write(this.file, output);
	}

	private has(id: string) {
		return Object.keys(this.registry).filter((x) => x == id).length > 0;
	}

	private load() {
		let object = FileLib.read(this.file);
		for (let i in object) {
			let settingData = object[i];
			settingData.scriptName = this.script;
			this.createSetting(settingData);
		}
	}

	private createSetting(data) {
		let setting;
		if (data.type == SettingType.BOOLEAN) {
			setting = new SettingBoolean(data);
		}
		else if (data.type == SettingType.INTEGER) {
			setting = new SettingInteger(data);
		}
		else if (data.type == SettingType.DOUBLE) {
			setting = new SettingDouble(data);
		}
		else if (data.type == SettingType.STRING) {
			setting = new SettingString(data);
		}
		else if (data.type == SettingType.COLOR_RGB) {
			setting = new SettingColorRGB(data);
		}
		else if (data.type == SettingType.COLOR_ARGB) {
			setting = new SettingColorARGB(data);
		}
		else if (data.type == SettingType.COLOR_MC) {
			setting = new SettingColorMC(data);
		}
		else if (data.type == SettingType.ENUM) {
			setting = new SettingEnum(data);
		}
		else if (data.type == SettingType.POS) {
			setting = new SettingPos(data);
		}
		else if (data.type == SettingType.ARRAY) {
			setting = new SettingArray(data);
		}

		if (setting != undefined) {
			setting.storage = this;
			this.registry[setting.id] = setting;
			return setting;
		}
		else {
			throw `Cant create ${data.systemLabel} setting: unknown type - ${data.type}`;
		}
	}

	static getSettingsFileList() {
		let dir = FileLib.getWorldDir().resolve(SettingStorage.settingDirectory);
		if (!FileLib.nioFiles.exists(dir)) {
			FileLib.nioFiles.createDirectories(dir);
		}
		dir = dir.toFile();
		let list = dir.listFiles();
		return Java.from(list).map((x: any) => x.getName());
	}
}

abstract class Setting<T> {

	readonly label: string;
	readonly storage: SettingStorage;
	readonly description: string;
	readonly systemLabel: string;
	readonly scriptName: string;
	readonly type: SettingType;
	readonly additionalData: any;
	value: T;
	defaultValue: T;

	callback: ((context: IScriptEvent, itemEntries: string[]) => void);

	protected constructor(data: { systemLabel: string, label: string, description: string, scriptName: string, type: SettingType, value: T, defaultValue: T, additionalData: any }) {
		this.label = data.label;
		this.systemLabel = data.systemLabel;
		this.scriptName = data.scriptName;
		this.description = data.description;
		this.type = data.type;
		this.value = data.value;
		this.defaultValue = data.defaultValue;
		this.additionalData = data.additionalData;
		this.callback = (c: IScriptEvent, itemEntries: string[] = []) => {
			if (itemEntries.length == 0) {
				this.setValue(c, this.getData(c));
			}
			else {
				if (itemEntries[3] == 'reset') {
					this.resetValue(c);
				}
			}
		};
	}

	get id(): string {
		return `Setting.${this.scriptName}.${this.systemLabel}`;
	}

	serialize(): { label: string, description: string, type: SettingType, systemLabel: string, value: T, defaultValue: T, additionalData: any } {
		return {
			label: this.label,
			description: this.description,
			type: this.type,
			systemLabel: this.systemLabel,
			value: this.value,
			defaultValue: this.defaultValue,
			additionalData: this.additionalData,
		};
	}

	render(root: IMappetUIBuilder): any{
		let row = root.row(4);
		row.label(this.label).h(20).labelAnchor(0, 0.5);
		return row;
	};

	abstract getData(c: IScriptEvent): T;

	abstract updateRender(c: IScriptEvent): void;

	getValue() {
		return this.value;
	}

	setValue(c: IScriptEvent, value: T): void {
		this.value = value;
		this.updateRender(c);
	};

	resetValue(c: IScriptEvent): void {
		this.setValue(c, this.defaultValue);
	}
}

class SettingBoolean extends Setting<boolean> {

	constructor(data) {
		super(data);
	}


	render(root: IMappetUIBuilder): any {
		let row = root.row(4);
		row.toggle(this.label, this.value).id(this.id).h(20);
		row.current.tooltip(this.description).context('refresh', `${this.id}.reset`, 'Reset value to default', 0x9966cc);
		return row;
	}

	getData(c: IScriptEvent) {
		return c.player.UIContext.data.getBoolean(this.id);
	}

	updateRender(c: IScriptEvent) {
		let component = <UIToggleComponent>c.player.UIContext.get(this.id);
		component.state(this.value);
	}
}

class SettingInteger extends Setting<number> {
	constructor(data) {
		super(data);
	}

	render(root: IMappetUIBuilder): any {
		let row = super.render(root);
		let trackpad = row.trackpad().integer().id(this.id).h(20).value(this.value);
		this.additionalData?.min ? trackpad.min(this.additionalData.min) : null;
		this.additionalData?.max ? trackpad.max(this.additionalData.max) : null;
		row.current.tooltip(this.description).context('refresh', `${this.id}.reset`, 'Reset value to default', 0x9966cc);
		return row;
	}

	getData(c: IScriptEvent) {
		return c.player.UIContext.data.getInt(this.id);
	}

	updateRender(c: IScriptEvent) {
		let component = <UITrackpadComponent>c.player.UIContext.get(this.id);
		component.value(this.value);
	}
}

class SettingDouble extends Setting<number> {
	constructor(data) {
		super(data);
	}

	render(root: IMappetUIBuilder): any {
		let row = super.render(root);
		let trackpad = row.trackpad().id(this.id).h(20).value(this.value);
		this.additionalData?.min ? trackpad.min(this.additionalData.min) : null;
		this.additionalData?.max ? trackpad.max(this.additionalData.max) : null;
		row.current.tooltip(this.description).context('refresh', `${this.id}.reset`, 'Reset value to default', 0x9966cc);
		return row;
	}

	getData(c: IScriptEvent) {
		return c.player.UIContext.data.getDouble(this.id);
	}

	updateRender(c: IScriptEvent) {
		let component = <UITrackpadComponent>c.player.UIContext.get(this.id);
		component.value(this.value);
	}
}

class SettingString extends Setting<string> {
	constructor(data) {
		super(data);
	}

	render(root: IMappetUIBuilder): any {
		let column = root.column(4);
		column.label(this.label).h(20).labelAnchor(0, 0.5);
		let row = column.row(4);
		row.textbox().id(this.id).h(20).label(this.value).maxLength(99999);
		row.current.tooltip(this.description).context('refresh', `${this.id}.reset`, 'Reset value to default', 0x9966cc);
		return row;
	}

	getData(c: IScriptEvent) {
		return c.player.UIContext.data.getString(this.id);
	}

	setValue(c: IScriptEvent, value: string): void {
		this.value = value;
	};

	updateRender(c: IScriptEvent) {
		let component = <UITextareaComponent>c.player.UIContext.get(this.id);
		component.label(this.value);
	}
}

class SettingParagraph extends SettingString{
	constructor(data) {
		super(data);
	}

	render(root: IMappetUIBuilder): any {
		let column = root.column(4);
		column.label(this.label).h(20).labelAnchor(0, 0.5);
		let row = column.row(4);
		row.textarea().id(this.id).h(this.value.length > 42 ? 60 : 30).label(this.value);
		row.current.tooltip(this.description).context('refresh', `${this.id}.reset`, 'Reset value to default', 0x9966cc);
		return row;
	}
}

class SettingColorRGB extends Setting<number> {
	constructor(data) {
		super(data);
	}

	render(root: IMappetUIBuilder): any {
		let row = super.render(root);
		let layout = row.layout();
		layout.current.rxy(1, 0).anchor(0, 0).h(20);
		layout.textbox(this.getRGB(this.value)).rw(1, -20).h(20).id(this.id).maxLength(6);
		let graphics = layout.graphics().rx(1, -20).id(`${this.id}.color`);
		graphics.rect(Number(`0xFF${this.getRGB(this.value)}`)).wh(20, 20);
		row.current.tooltip(this.description).context('refresh', `${this.id}.reset`, 'Reset value to default', 0x9966cc);
		return row;
	}

	getData(c: IScriptEvent) {
		return Number(`0x${c.player.UIContext.data.getString(this.id)}`);
	}

	updateRender(c: IScriptEvent) {
		let graphics = <UIGraphicsComponent>c.player.UIContext.get(`${this.id}.color`);
		graphics.rect(Number(`0xFF${this.getRGB(this.value)}`)).wh(20, 20);
	}

	resetValue(c: IScriptEvent) {
		let component = <UITextboxComponent>c.player.UIContext.get(this.id);
		let rgb = this.getRGB(this.defaultValue);
		component.label(rgb);
		this.setValue(c, Number(`0x${rgb}`));
	}

	getRGB(value: number) {
		let hex = value.toString(16);
		return `000000${hex}`.slice(-6);
	}
}

class SettingColorARGB extends Setting<number> {
	constructor(data) {
		super(data);
	}

	render(root: IMappetUIBuilder): any {
		let row = super.render(root);
		let layout = row.layout();
		layout.current.rxy(1, 0).anchor(0, 0).h(20);
		layout.textbox(this.getARGB(this.value)).rw(1, -20).h(20).id(this.id).maxLength(8);
		let graphics = layout.graphics().rx(1, -20).id(`${this.id}.color`);
		graphics.rect(Number(`0xFF${this.getARGB(this.value).slice(-6)}`)).wh(20, 20);
		row.current.tooltip(this.description).context('refresh', `${this.id}.reset`, 'Reset value to default', 0x9966cc);
		return row;
	}

	getData(c: IScriptEvent) {
		return Number(`0x${c.player.UIContext.data.getString(this.id)}`);
	}

	updateRender(c: IScriptEvent) {
		let graphics = <UIGraphicsComponent>c.player.UIContext.get(`${this.id}.color`);
		graphics.rect(Number(`0xFF${this.getARGB(this.value).slice(-6)}`)).wh(20, 20);
	}

	resetValue(c: IScriptEvent) {
		let component = <UITextboxComponent>c.player.UIContext.get(this.id);
		let argb = this.getARGB(this.defaultValue);
		component.label(argb);
		this.setValue(c, Number(`0x${argb}`));
	}

	getARGB(value: number) {
		let hex = value.toString(16);
		return `00000000${hex}`.slice(-8);
	}
}

class SettingColorMC extends Setting<string> {
	constructor(data) {
		super(data);
		this.callback = (c: IScriptEvent, itemEntries: string[] = []) => {
			if (itemEntries.length == 0) {
				this.setValue(c, this.getData(c));
			}
			else if (itemEntries[3] == 'reset') {
				this.resetValue(c);
			}
			else if (itemEntries[3] == 'pickColor') {
				this.setValue(c, ColorMC[itemEntries[4]]);
			}
		};
	}

	render(root: IMappetUIBuilder): any {
		let row = super.render(root);
		let layout = row.layout();
		layout.current.rxy(1, 0).anchor(0, 0).h(20);
		let graphics = layout.graphics().rx(1, -20).id(`${this.id}.color`);
		graphics.rect(-106, 0, 126, 20, 0x66000000);
		graphics.rect(Number(`0xFF${this.getRGB()}`)).wh(20, 20);
		layout.label(this.getKey(this.value)).rw(1, -20).labelAnchor(0.5, 0.5).h(20).id(`${this.id}.label`);
		row.current.tooltip(this.description).context('refresh', `${this.id}.reset`, 'Reset value to default', 0x9966cc);
		for (let i of Object.keys(ColorMC)) {
			row.current.context('material', `${this.id}.pickColor.${i}`, i, Number(`0x${ColorMC[i][1]}`));
		}
		return row;
	}

	getData(c: IScriptEvent) {
		return `0x${c.player.UIContext.data.getString(this.id)}`;
	}

	updateRender(c: IScriptEvent) {
		let graphics = <UIGraphicsComponent>c.player.UIContext.get(`${this.id}.color`);
		graphics.rect(Number(`0xFF${this.getRGB()}`)).wh(20, 20);
		let text = <UILabelComponent>c.player.UIContext.get(`${this.id}.label`);
		text.label(this.getKey(this.value));
	}

	getRGB() {
		return this.value[1];
	}

	getValue() {
		return this.value[0];
	}

	getKey(value: string): string {
		for (let i in ColorMC) {
			if (ColorMC[i][0] == value[0]) {
				return i;
			}
		}
		return '';
	}
}

class SettingEnum extends Setting<string> {
	constructor(data) {
		super(data);
		this.callback = (c: IScriptEvent, itemEntries: string[] = []) => {
			if (itemEntries.length == 0) {
				this.setValue(c, this.getData(c));
			}
			else if (itemEntries[3] == 'reset') {
				this.resetValue(c);
			}
			else if (itemEntries[3] == 'pickEnum') {
				this.setValue(c, itemEntries[4]);
			}
		};
	}

	render(root: IMappetUIBuilder): any {
		let row = super.render(root);
		let layout = row.layout();
		let graphics = layout.graphics().rx(1, -20);
		graphics.rect(-106, 0, 126, 20, 0x66000000);
		layout.label(this.value).id(`${this.id}.enum`).h(20).rxy(0.5, 0).labelAnchor(0.5, 0.5);
		row.current.tooltip(this.description).context('refresh', `${this.id}.reset`, 'Reset value to default', 0x9966cc);
		for (let entry of this.additionalData.enumList) {
			row.current.context('left_handle', `${this.id}.pickEnum.${entry}`, entry);
		}
		return row;
	}

	getData(c: IScriptEvent) {
		return c.player.UIContext.data.getString(this.id);
	}

	updateRender(c: IScriptEvent) {
		let component = <UILabelComponent>c.player.UIContext.get(`${this.id}.enum`);
		component.label(this.value);
	}
}

class SettingPos extends Setting<number[]> {

	constructor(data) {
		super(data);
	}

	render(root: IMappetUIBuilder): void {
		let column = root.column(4);
		column.label(this.label).h(20).labelAnchor(0, 0.5);
		let posRow = column.row(4);
		for (let i in this.value) {
			posRow.trackpad().integer().id(`${this.id}.${i}`).h(20).value(this.value[i]);
		}
		column.current.tooltip(this.description).context('refresh', `${this.id}.reset`, 'Reset value to default', 0x9966cc);
	}

	getData(c: IScriptEvent) {
		let arr: number[] = [];
		for (let i in this.value) {
			arr.push(c.player.UIContext.data.getInt(`${this.id}.${i}`));
		}
		return arr;
	}

	updateRender(c: IScriptEvent) {
		for (let i in this.value) {
			c.player.UIContext.data.setInt(`${this.id}.${i}`, this.value[i]);
			let component = <UITrackpadComponent>c.player.UIContext.get(`${this.id}.${i}`);
			component.value(this.value[i]);
		}
	}

}

class SettingArray extends Setting<any[]> {
	constructor(data) {
		super(data);
		this.callback = (c: IScriptEvent, itemEntries: string[] = []) => {
			if (itemEntries.length == 0) {
				c.player.closeUI();
				globalTLSETTINGS.currentSetting = this.id;
				c.scheduleScript(c.script, 'TL_SETTINGS_ARRAY_UI', 1);
			}
			else {
				if (itemEntries[3] == 'reset') {
					this.resetValue(c);
				}
			}
		};
	}

	getData(c: IScriptEvent): any[] {
		return this.value;
	}

	entryRender(root: IMappetUIBuilder, entry: any, index: number) {
		let layout = root.layout();
		layout.current.h(20);
		layout.label(String(index)).h(20).rw(0.1).labelAnchor(0, 1).anchor(0, 0);
		let row = layout.row(4, 4);
		row.current.h(20).rw(0.9).anchor(1, 0).rx(1);

		row.current.context('refresh', `entry.${index}.reset`, 'Reset', 0x9966cc);
		row.current.context('copy', `entry.${index}.copy`, 'Copy', 0x6699cc);
		row.current.context('add', `entry.${index}.add`, 'Add', 0x66cc66);
		row.current.context('remove', `entry.${index}.remove`, 'Remove', 0xcc6666);

		if (this.additionalData.arrayType == SettingType.INTEGER) {
			row.trackpad(entry).integer().h(20).id(`entry.${index}`);
		}
		if (this.additionalData.arrayType == SettingType.DOUBLE) {
			row.trackpad(entry).h(20).id(`entry.${index}`);
		}
		if (this.additionalData.arrayType == SettingType.BOOLEAN) {
			row.toggle(String(index)).state(entry).h(20).id(`entry.${index}`);
		}
		if (this.additionalData.arrayType == SettingType.STRING) {
			row.textbox(entry).h(20).id(`entry.${index}`);
		}
		if (this.additionalData.arrayType == SettingType.COLOR_RGB) {
			let layout = row.layout();
			layout.current.rxy(1, 0).anchor(0, 0).h(20);
			layout.textbox(`000000${entry.toString(16)}`.slice(-6)).rw(1, -20).h(20).id(`entry.${index}`).maxLength(6);
			let graphics = layout.graphics().rx(1, -20).id(`entry.${index}.color`);
			graphics.rect(Number(`0xFF${`000000${entry.toString(16)}`.slice(-6)}`)).wh(20, 20);
		}
		if (this.additionalData.arrayType == SettingType.COLOR_ARGB) {
			let layout = row.layout();
			layout.current.rxy(1, 0).anchor(0, 0).h(20);
			layout.textbox(`00000000${entry.toString(16)}`.slice(-8)).rw(1, -20).h(20).id(`entry.${index}`).maxLength(8);
			let graphics = layout.graphics().rx(1, -20).id(`entry.${index}.color`);
			graphics.rect(Number(`0xFF${`000000${entry.toString(16)}`.slice(-6)}`)).wh(20, 20);
		}
		if (this.additionalData.arrayType == SettingType.COLOR_MC) {
			let layout = row.layout();
			layout.current.rxy(1, 0).anchor(0, 0).h(20);
			layout.label(this.getKey(entry)).rw(1, -20).h(20).labelAnchor(0.5, 0.5).id(`entry.${index}`).background(0xcc000000);
			let graphics = layout.graphics().rx(1, -20).id(`entry.${index}.color`);
			graphics.rect(Number(`0xFF${`000000${entry[1].toString(16)}`.slice(-6)}`)).wh(20, 20);

			for (let i of Object.keys(ColorMC)) {
				row.current.context('material', `entry.${index}.pickColor.${i}`, i, Number(`0x${ColorMC[i][1]}`));
			}
		}
		if (this.additionalData.arrayType == SettingType.ENUM) {
			row.label(entry).h(20).labelAnchor(0.5, 0.5).background(0xcc000000);
			for (let enumEntry of this.additionalData.enumList) {
				row.current.context('left_handle', `entry.${index}.pickEnum.${enumEntry}`, enumEntry);
			}
		}
		if (this.additionalData.arrayType == SettingType.POS) {
			for (let i in entry) {
				row.trackpad().integer().h(20).value(entry[i]).id(`entry.${index}.${i}`);
			}
		}
		if (this.additionalData.arrayType == SettingType.PARAGRAPH) {
			row.textarea(entry).h(60).id(`entry.${index}`);
		}
	}

	getKey(value: string): string {
		for (let i in ColorMC) {
			if (ColorMC[i][0] == value[0]) {
				return i;
			}
		}
		return '';
	}

	getEntryValue(context: IMappetUIContext, id: string) {
		if (this.additionalData.arrayType == SettingType.INTEGER) {
			return context.data.getInt(id);
		}
		if (this.additionalData.arrayType == SettingType.DOUBLE) {
			return context.data.getDouble(id);
		}
		if (this.additionalData.arrayType == SettingType.BOOLEAN) {
			return context.data.getBoolean(id);
		}
		if (this.additionalData.arrayType == SettingType.STRING) {
			return context.data.getString(id);
		}
		if (this.additionalData.arrayType == SettingType.COLOR_RGB) {
			return Number(`0x${context.data.getString(id)}`);
		}
		if (this.additionalData.arrayType == SettingType.COLOR_ARGB) {
			return Number(`0x${context.data.getString(id)}`);
		}
		if (this.additionalData.arrayType == SettingType.COLOR_MC) {
			return null;
		}
		if (this.additionalData.arrayType == SettingType.ENUM) {
			return null;
		}
		if (this.additionalData.arrayType == SettingType.POS) {
			let arr: number[] = [];
			for (let i = 0; i < 3; i ++) {
				arr.push(context.data.getInt(`${id}.${i}`));
			}
			return arr;
		}
		if (this.additionalData.arrayType == SettingType.PARAGRAPH) {
			return context.data.getString(id);
		}
	}

	getEmpty() {
		if (this.additionalData.arrayType == SettingType.INTEGER) {
			return 0;
		}
		if (this.additionalData.arrayType == SettingType.DOUBLE) {
			return 0;
		}
		if (this.additionalData.arrayType == SettingType.BOOLEAN) {
			return false;
		}
		if (this.additionalData.arrayType == SettingType.STRING) {
			return '';
		}
		if (this.additionalData.arrayType == SettingType.COLOR_RGB) {
			return 0x000000;
		}
		if (this.additionalData.arrayType == SettingType.COLOR_ARGB) {
			return 0x00000000;
		}
		if (this.additionalData.arrayType == SettingType.COLOR_MC) {
			return ColorMC.BLACK;
		}
		if (this.additionalData.arrayType == SettingType.ENUM) {
			return this.additionalData.enumList[0];
		}
		if (this.additionalData.arrayType == SettingType.POS) {
			return [0, 0, 0];
		}
		if (this.additionalData.arrayType == SettingType.PARAGRAPH) {
			return '';
		}
	}

	render(root: IMappetUIBuilder): any {
		let row = root.row(4);
		row.label(this.label).h(20).labelAnchor(0, 0.5);
		row.button(`edit...(${this.value.length})`).id(this.id);
		row.current.tooltip(this.description).context('refresh', `${this.id}.reset`, 'Reset value to default', 0x9966cc);
		return row;
	}

	updateRender(c: IScriptEvent): void {
		let component = <UIButtonComponent>c.player.UIContext.get(this.id);
		component.label(`edit...(${this.value.length})`);
	}

}
