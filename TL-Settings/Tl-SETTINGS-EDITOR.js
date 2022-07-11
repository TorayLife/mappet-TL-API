var globalTLSETTINGS = {
    fileList: [],
    storageList: [],
    currentScript: '',
    currentSetting: '',
};
function main(c) {
    var root = mappet.createUI(c, 'TL_SETTINGS_UI_HANDLER').background();
    root.current.keybind(63, 'F5', 'F5');
    var thisStorage = new SettingStorage(c.script);
    var margin = thisStorage.get('margin', 'Margin', 'Cool description', SettingType.INTEGER, 4);
    var debug = thisStorage.get('debug', 'Debug', 'Used to make sure that all settings have the correct types and that everything is' +
        ' correct.', SettingType.BOOLEAN, false);
    /*
     * do not delete these settings, they are needed as a hint.
     * If you don't need them, comment them out.
     */
    var testInteger = thisStorage.get('testInteger', 'Test Integer', 'Test integer description', SettingType.INTEGER, 4, { min: 4, max: 8 });
    var testDouble = thisStorage.get('testDouble', 'test Double', 'test Double description', SettingType.DOUBLE, 4.555);
    var testBoolean = thisStorage.get('testBoolean', 'test Boolean', 'test Boolean description', SettingType.BOOLEAN, true);
    var testString = thisStorage.get('testString', 'test String', 'test string description', SettingType.STRING, "Look at my horse, my horse is amazing!");
    var testRGB = thisStorage.get('testRGB', 'test RGB', 'test RGB description', SettingType.COLOR_RGB, 0xFF42AB);
    var testARGB = thisStorage.get('testARGB', 'test ARGB', 'test ARGB description', SettingType.COLOR_ARGB, 0xFF55ff55);
    var testColorMC = thisStorage.get('testColorMC', 'test MC', 'test MC description', SettingType.COLOR_MC, ColorMC.RED);
    var testEnum = thisStorage.get('testEnum', 'test Enum', '', SettingType.ENUM, 'enum1', { enumList: ['enum1', 'enum2', 'enum3'] });
    var testPos = thisStorage.get('testPos', 'testPos', 'desc', SettingType.POS, [1000, 5, 1000]);
    var testArray = thisStorage.get('testArray', 'test Array', 'Cool description', SettingType.ARRAY, [1, 2, 3], { arrayType: SettingType.INTEGER });
    var testArrayColorRGB = thisStorage.get('testArrayColorRGB', 'test Array color RGB', 'Cool description', SettingType.ARRAY, [0xFF42AB], { arrayType: SettingType.COLOR_RGB });
    var testArrayColorARGB = thisStorage.get('testArrayColorARGB', 'test Array color ARGB', 'Cool description', SettingType.ARRAY, [0xFF0042AB], { arrayType: SettingType.COLOR_ARGB });
    var testArrayColorMC = thisStorage.get('testArrayColorMC', 'test Array color MC', 'Cool description', SettingType.ARRAY, [ColorMC.RED], { arrayType: SettingType.COLOR_MC });
    var testArrayEnum = thisStorage.get('testArrayEnum', 'test Array Enum', 'Cool description', SettingType.ARRAY, ['variant 1'], { arrayType: SettingType.ENUM, enumList: ['variant 1', 'variant 2', 'variant 3'] });
    var testArrayPos = thisStorage.get('testArrayPos', 'test Array Pos', 'Cool description', SettingType.ARRAY, [[2, 5, 6], [3, 3, 3]], { arrayType: SettingType.POS });
    if (debug) {
        var s = c.player;
        printDebug(s, 'testInteger', testInteger);
        printDebug(s, 'testDouble', testDouble);
        printDebug(s, 'testBoolean', testBoolean);
        printDebug(s, 'testString', testString);
        printDebug(s, 'testRGB', testRGB);
        printDebug(s, 'testARGB', testARGB);
        printDebug(s, 'testColorMC', testColorMC);
        printDebug(s, 'testEnum', testEnum);
        printDebug(s, 'testPos', testPos);
        printDebug(s, 'testArray', testArray);
        printDebug(s, 'testArrayColorRGB', testArrayColorRGB);
        printDebug(s, 'testArrayColorARGB', testArrayColorARGB);
        printDebug(s, 'testArrayColorMC', testArrayColorMC);
        printDebug(s, 'testArrayEnum', testArrayEnum);
        printDebug(s, 'testArrayPos', testArrayPos);
    }
    globalTLSETTINGS.fileList = SettingStorage.getSettingsFileList().map(function (x) { return x.replace('.json', ''); });
    globalTLSETTINGS.fileList.push('globalSettings');
    for (var _i = 0, _a = globalTLSETTINGS.fileList; _i < _a.length; _i++) {
        var setting = _a[_i];
        globalTLSETTINGS.storageList[setting] = setting == 'globalSettings' ? new SettingStorage(setting, false) : new SettingStorage(setting);
    }
    globalTLSETTINGS.currentScript = globalTLSETTINGS.currentScript ? globalTLSETTINGS.currentScript : globalTLSETTINGS.fileList[0];
    var scriptList = root.stringList(globalTLSETTINGS.fileList).id('scriptList').selected(globalTLSETTINGS.fileList.indexOf(globalTLSETTINGS.currentScript));
    scriptList.rxy(0, 0).rwh(0.15, 1).background();
    scriptList.context('remove', 'scriptList.removeSelected', 'Remove selected setting file');
    scriptList.context('refresh', 'scriptList.resetAllSelected', 'Reset all settings from selected file');
    for (var i in globalTLSETTINGS.fileList) {
        var layout = root.layout();
        layout.current.rxy(0.15, 0).rwh(0.85, 1).id('layout.' + globalTLSETTINGS.fileList[i]).visible(globalTLSETTINGS.fileList[i] == globalTLSETTINGS.currentScript);
        var settingList = layout.column(margin, 10);
        settingList.current.scroll().horizontal().rwh(1, 1).width(256);
        var currentScriptSettings = globalTLSETTINGS.storageList[globalTLSETTINGS.fileList[i]].registry;
        for (var i_1 in currentScriptSettings) {
            currentScriptSettings[i_1].render(settingList);
        }
    }
    c.player.openUI(root, true);
}
function TL_SETTINGS_UI_HANDLER(c) {
    var context = c.player.UIContext;
    var lastId = context.last;
    var lastEntries = context.last.split('.');
    var item = context.context;
    var itemEntries = item.split('.');
    var key = context.hotkey;
    if (context.isClosed()) {
        return;
    }
    if (key == 'F5') {
        c.player.closeUI();
        c.scheduleScript(c.script, 'main', 1);
    }
    if (key == '' && item == 'scriptList.removeSelected') {
        FileLib.delete(FileLib.get('settings', globalTLSETTINGS.currentScript + ".json"));
        c.player.closeUI();
    }
    if (key == '' && item == 'scriptList.resetAllSelected') {
        var settingStorage = new SettingStorage(globalTLSETTINGS.currentScript);
        for (var i in settingStorage.registry) {
            settingStorage.registry[i].callback(c, ['Setting', globalTLSETTINGS.currentScript, '', 'reset']);
            settingStorage.save();
        }
    }
    if (key == '' && item.startsWith('Setting.')) {
        var settingStorage = new SettingStorage(itemEntries[1]);
        var setting = settingStorage.registry["Setting." + itemEntries[1] + "." + itemEntries[2]];
        setting.callback(c, itemEntries);
        settingStorage.save();
    }
    if (lastId == 'scriptList') {
        var index = context.data.getInt('scriptList.index');
        for (var i = 0; i < globalTLSETTINGS.fileList.length; i++) {
            context.get('layout.' + globalTLSETTINGS.fileList[i]).visible(i == index);
            globalTLSETTINGS.currentScript = globalTLSETTINGS.fileList[index];
        }
    }
    else if (lastId.startsWith('Setting.')) {
        var settingStorage = new SettingStorage(lastEntries[1]);
        var setting = settingStorage.registry["Setting." + lastEntries[1] + "." + lastEntries[2]];
        setting.callback(c, []);
        settingStorage.save();
    }
}
function TL_SETTINGS_ARRAY_UI(c) {
    try {
        var settingId = globalTLSETTINGS.currentSetting;
        var scriptId = globalTLSETTINGS.currentScript;
        var settingStorage = new SettingStorage(scriptId);
        var setting = settingStorage.registry[settingId];
        var root = mappet.createUI(c, 'TL_SETTINGS_ARRAY_UI_HANDLER').background().closable(false);
        root.current.keybind(1, 'esc', 'Close the UI');
        var entryList = root.column(4, 4);
        entryList.current.scroll().rwh(0.3, 0.5).rxy(0.5, 0.5).anchor(0.5, 0.5);
        var row = entryList.row(4);
        row.label(scriptId + ": " + setting.label).wh(180, 20).labelAnchor(0, 0.5);
        var iconRow = row.row(4);
        iconRow.icon('add').id('entry.-1.add').tooltip('add new array element').h(20).anchor(1, 0.5);
        for (var i = 0; i < setting.value.length; i++) {
            var entry = setting.value[i];
            setting.entryRender(entryList, entry, i);
        }
        c.player.openUI(root, true);
    }
    catch (e) {
        c.player.send(e);
    }
}
function TL_SETTINGS_ARRAY_UI_HANDLER(c) {
    var context = c.player.UIContext;
    var lastId = context.last;
    var lastEntries = lastId.split('.');
    var item = context.context;
    var itemEntries = item.split('.');
    var key = context.hotkey;
    var esc = key == 'esc';
    var settingId = globalTLSETTINGS.currentSetting;
    var scriptId = globalTLSETTINGS.currentScript;
    var settingStorage = new SettingStorage(scriptId);
    var setting = settingStorage.registry[settingId];
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
        setting.value[lastEntries[1]] = setting.getEntryValue(context, lastEntries[0] + "." + lastEntries[1]);
        if (setting.additionalData.arrayType == SettingType.COLOR_RGB) {
            var component = context.get("entry." + lastEntries[1] + ".color");
            var color = "0xFF" + ("000000" + setting.value[lastEntries[1]].toString(16)).slice(-6);
            component.rect(Number(color)).wh(20, 20);
        }
        if (setting.additionalData.arrayType == SettingType.COLOR_ARGB) {
            var component = context.get("entry." + lastEntries[1] + ".color");
            var color = "0xFF" + ("00000000" + setting.value[lastEntries[1]].toString(16)).slice(-8);
            component.rect(Number(color)).wh(20, 20);
        }
        settingStorage.save();
    }
    if (itemEntries[0] == 'entry' && itemEntries[1] != '-1') {
        if (itemEntries[2] == 'reset') {
            setting.value[itemEntries[1]] = setting.defaultValue[itemEntries[1]] ? setting.defaultValue[itemEntries[1]] : setting.value[itemEntries[1]];
        }
        if (itemEntries[2] == 'copy') {
            var index = itemEntries[1];
            setting.value.splice(index, 0, setting.value[index]);
        }
        if (itemEntries[2] == 'add') {
            var index = itemEntries[1];
            setting.value.splice(Number(index) + 1, 0, setting.getEmpty());
        }
        if (itemEntries[2] == 'remove') {
            var index = itemEntries[1];
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
function printDebug(s, name, value) {
    s.send("\u00A72====" + name + "====");
    s.send("\u00A77Type: \u00A7b" + typeof value);
    s.send("\u00A77Value: \u00A76" + JSON.stringify(value));
}
