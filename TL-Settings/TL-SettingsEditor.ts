/*! TL-SettingsEditor
 * Version: 0.0.2
 * https://github.com/TorayLife/mappet-TL-API/tree/master/TL-Settings
 * Made by TorayLife (https://github.com/TorayLife)
 */


let globalTLSETTINGS: any = {
	fileList: [],
	storageList: [],
	currentScript: '',
	currentSetting: '',
};

function main(c: IScriptEvent) {
	Task.run(() => {
		let root = mappet.createUI(c, 'TL_SETTINGS_UI_HANDLER').background();
		root.current.keybind(63, 'F5', 'F5');
		let thisStorage = new SettingStorage(c.script);
		let margin = thisStorage.init('margin', 'Margin', 'The gap between settings.', SettingType.INTEGER, 4);

		globalTLSETTINGS.fileList = SettingStorage.getSettingsFileList().map((x) => x.replace('.json', ''));
		globalTLSETTINGS.fileList.push('globalSettings');
		for (let setting of globalTLSETTINGS.fileList) {
			globalTLSETTINGS.storageList[setting] = setting == 'globalSettings' ? new SettingStorage(setting, false) : new SettingStorage(setting);
		}
		globalTLSETTINGS.currentScript = globalTLSETTINGS.currentScript ? globalTLSETTINGS.currentScript : globalTLSETTINGS.fileList[0];

		let scriptList = root.stringList(globalTLSETTINGS.fileList).id('scriptList').selected(globalTLSETTINGS.fileList.indexOf(globalTLSETTINGS.currentScript));
		scriptList.rxy(0, 0).rwh(0.15, 1).background();
		scriptList.context('remove', 'scriptList.removeSelected', 'Remove selected setting file');
		scriptList.context('refresh', 'scriptList.resetAllSelected', 'Reset all settings from selected file');
		for (let i in globalTLSETTINGS.fileList) {
			let layout = root.layout();
			layout.current.rxy(0.15, 0).rwh(0.85, 1).id('layout.' + globalTLSETTINGS.fileList[i]).visible(globalTLSETTINGS.fileList[i] == globalTLSETTINGS.currentScript);
			let settingList = layout.column(margin, 10);
			settingList.current.scroll().horizontal().rwh(1, 1).width(256);
			let currentScriptSettings = globalTLSETTINGS.storageList[globalTLSETTINGS.fileList[i]].registry;
			for (let i in currentScriptSettings) {
				currentScriptSettings[i].render(settingList);
			}
		}


		c.player.openUI(root, true);
	});
}

function TL_SETTINGS_UI_HANDLER(c: IScriptEvent) {
	let context = c.player.UIContext;
	let lastId = context.last;
	let lastEntries = context.last.split('.');
	let item = context.context;
	let itemEntries = item.split('.');
	let key = context.hotkey;

	if (context.isClosed()) {
		return;
	}
	if (key == 'F5') {
		c.player.closeUI();
		c.scheduleScript(c.script, 'main', 1);
	}

	if (key == '' && item == 'scriptList.removeSelected') {
		FileLib.delete(FileLib.get('settings', `${globalTLSETTINGS.currentScript}.json`));
		c.player.closeUI();
	}

	if (key == '' && item == 'scriptList.resetAllSelected') {
		let settingStorage = new SettingStorage(globalTLSETTINGS.currentScript);
		for (let i in settingStorage.registry) {
			settingStorage.registry[i].callback(c, ['Setting', globalTLSETTINGS.currentScript, '', 'reset']);
			settingStorage.save();
		}

	}

	if (key == '' && item.startsWith('Setting.')) {
		let settingStorage = new SettingStorage(itemEntries[1]);
		let setting = settingStorage.registry[`Setting.${itemEntries[1]}.${itemEntries[2]}`];
		setting.callback(c, itemEntries);
		settingStorage.save();
	}

	if (lastId == 'scriptList') {
		let index = context.data.getInt('scriptList.index');
		for (let i = 0; i < globalTLSETTINGS.fileList.length; i++) {
			context.get('layout.' + globalTLSETTINGS.fileList[i]).visible(i == index);
			globalTLSETTINGS.currentScript = globalTLSETTINGS.fileList[index];
		}
	}
	else if (lastId.startsWith('Setting.')) {
		let settingStorage = new SettingStorage(lastEntries[1]);
		let setting = settingStorage.registry[`Setting.${lastEntries[1]}.${lastEntries[2]}`];
		setting.callback(c, []);
		settingStorage.save();
	}
}

function TL_SETTINGS_ARRAY_UI(c: IScriptEvent) {
	try {
		let settingId = globalTLSETTINGS.currentSetting;
		let scriptId = globalTLSETTINGS.currentScript;

		let settingStorage = new SettingStorage(scriptId);
		let setting = settingStorage.registry[settingId];
		let root = mappet.createUI(c, 'TL_SETTINGS_ARRAY_UI_HANDLER').background().closable(false);
		root.current.keybind(1, 'esc', 'Close the UI');
		let entryList = root.column(4, 4);
		entryList.current.scroll().rwh(0.3, 0.5).rxy(0.5, 0.5).anchor(0.5, 0.5);

		let row = entryList.row(4);
		row.label(`${scriptId}: ${setting.label}`).wh(180, 20).labelAnchor(0, 0.5);
		let iconRow = row.row(4);
		iconRow.icon('add').id('entry.-1.add').tooltip('add new array element').h(20).anchor(1, 0.5);

		for (let i = 0; i < setting.value.length; i++) {
			let entry = setting.value[i];
			setting.entryRender(entryList, entry, i);
		}

		c.player.openUI(root, true);
	}
	catch (e) {
		c.player.send(e);
	}
}

function TL_SETTINGS_ARRAY_UI_HANDLER(c: IScriptEvent) {
	let context = c.player.UIContext;
	let lastId = context.last;
	let lastEntries = lastId.split('.');
	let item = context.context;
	let itemEntries = item.split('.');
	let key = context.hotkey;
	let esc = key == 'esc';


	let settingId = globalTLSETTINGS.currentSetting;
	let scriptId = globalTLSETTINGS.currentScript;
	let settingStorage = new SettingStorage(scriptId);
	let setting = settingStorage.registry[settingId];

	if (esc) {
		c.player.closeUI();
		c.scheduleScript(c.script, 'main', 1);
		return;
	}

	if (context.isClosed()) {
		return;
	}

	if (lastId == 'entry.-1.add') {
		setting.value.splice(0, 0, setting.getEmpty());
		settingStorage.save();
		c.player.closeUI();
		c.scheduleScript(c.script, 'TL_SETTINGS_ARRAY_UI', 1);
	}

	if (item == '' && lastEntries[0] == 'entry') {
		setting.value[lastEntries[1]] = setting.getEntryValue(context, `${lastEntries[0]}.${lastEntries[1]}`);
		if (setting.additionalData.arrayType == SettingType.COLOR_RGB) {
			let component = <UIGraphicsComponent>context.get(`entry.${lastEntries[1]}.color`);
			let color = `0xFF${`000000${setting.value[lastEntries[1]].toString(16)}`.slice(-6)}`;
			component.rect(Number(color)).wh(20, 20);
		}
		if (setting.additionalData.arrayType == SettingType.COLOR_ARGB) {
			let component = <UIGraphicsComponent>context.get(`entry.${lastEntries[1]}.color`);
			let color = `0xFF${`00000000${setting.value[lastEntries[1]].toString(16)}`.slice(-8)}`;
			component.rect(Number(color)).wh(20, 20);
		}


		settingStorage.save();
	}
	if (itemEntries[0] == 'entry' && itemEntries[1] != '-1') {
		if (itemEntries[2] == 'reset') {
			setting.value[itemEntries[1]] = setting.defaultValue[itemEntries[1]] ? setting.defaultValue[itemEntries[1]] : setting.value[itemEntries[1]];
		}
		if (itemEntries[2] == 'copy') {
			let index = itemEntries[1];
			setting.value.splice(index, 0, setting.value[index]);
		}
		if (itemEntries[2] == 'add') {
			let index = itemEntries[1];
			setting.value.splice(Number(index) + 1, 0, setting.getEmpty());
		}
		if (itemEntries[2] == 'remove') {
			let index = itemEntries[1];
			setting.value.splice(index, 1);
		}
		if (itemEntries[2] == 'pickColor') {
			setting.value[itemEntries[1]] = ColorMC[itemEntries[3]];
		}
		if (itemEntries[2] == 'pickEnum') {
			setting.value[itemEntries[1]] = itemEntries[3];
		}
		settingStorage.save();
		c.player.closeUI();
		c.scheduleScript(c.script, 'TL_SETTINGS_ARRAY_UI', 1);
		return;
	}
}
