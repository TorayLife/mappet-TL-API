//TL-SETTINGS
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
var ColorMC = {
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
var SettingType;
(function (SettingType) {
    SettingType[SettingType["BOOLEAN"] = 0] = "BOOLEAN";
    SettingType[SettingType["INTEGER"] = 1] = "INTEGER";
    SettingType[SettingType["DOUBLE"] = 2] = "DOUBLE";
    SettingType[SettingType["STRING"] = 3] = "STRING";
    SettingType[SettingType["COLOR_RGB"] = 4] = "COLOR_RGB";
    SettingType[SettingType["COLOR_ARGB"] = 5] = "COLOR_ARGB";
    SettingType[SettingType["COLOR_MC"] = 6] = "COLOR_MC";
    SettingType[SettingType["ENUM"] = 7] = "ENUM";
    SettingType[SettingType["POS"] = 8] = "POS";
    SettingType[SettingType["ARRAY"] = 9] = "ARRAY";
})(SettingType || (SettingType = {}));
var SettingStorage = /** @class */ (function () {
    function SettingStorage(fileName, init) {
        if (init === void 0) { init = true; }
        this.script = fileName;
        this.registry = {};
        if (init) {
            SettingStorage.initGlobalSettings();
        }
        if (SettingStorage.settingDirectory == '') {
            SettingStorage.settingDirectory = 'settings';
        }
        this.initFile(fileName == 'globalSettings' ? '' : SettingStorage.settingDirectory, fileName);
        this.load();
    }
    SettingStorage.prototype.initFile = function (directory, fileName) {
        if (!FileLib.has(directory, fileName + ".json")) {
            FileLib.create(directory, fileName + ".json");
        }
        this.file = FileLib.get(directory, fileName + ".json");
    };
    SettingStorage.initGlobalSettings = function () {
        if (!FileLib.has('', "globalSettings.json")) {
            FileLib.create('', "globalSettings.json");
        }
        SettingStorage.settingDirectory = '';
        var storage = new SettingStorage('globalSettings', false);
        SettingStorage.settingDirectory = storage.get('settingDirectory', 'Setting directory', 'Folder that uses by script to storage' +
            ' settings', SettingType.STRING, 'settings');
    };
    SettingStorage.prototype.get = function (systemLabel, label, description, type, value, additionalData) {
        if (additionalData === void 0) { additionalData = null; }
        var fullId = "Setting." + this.script + "." + systemLabel;
        if (this.has(fullId)) {
            if (this.registry[fullId].type != type) {
                throw "Setting " + fullId + "'s has another type: " + SettingType[this.registry[fullId].type] + " : " + SettingType[type];
            }
            this.registry[fullId].label = label;
            this.registry[fullId].description = description;
            this.registry[fullId].additionalData = additionalData;
            this.save();
            return this.registry[fullId].getValue();
        }
        else {
            var data = {
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
            var setting = this.createSetting(data);
            this.save();
            return setting.value;
        }
    };
    SettingStorage.prototype.save = function () {
        var obj = this.registry;
        var keys = Object.keys(obj);
        var output = {};
        for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
            var i = keys_1[_i];
            output[i] = obj[i].serialize();
        }
        FileLib.write(this.file, output);
    };
    SettingStorage.prototype.has = function (id) {
        return Object.keys(this.registry).filter(function (x) { return x == id; }).length > 0;
    };
    SettingStorage.prototype.load = function () {
        var object = FileLib.read(this.file);
        for (var i in object) {
            var settingData = object[i];
            settingData.scriptName = this.script;
            this.createSetting(settingData);
        }
    };
    SettingStorage.prototype.createSetting = function (data) {
        var setting;
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
            throw "Cant create " + data.systemLabel + " setting: unknown type - " + data.type;
        }
    };
    SettingStorage.getSettingsFileList = function () {
        var dir = FileLib.getWorldDir().resolve(SettingStorage.settingDirectory);
        if (!FileLib.nioFiles.exists(dir)) {
            FileLib.nioFiles.createDirectories(dir);
        }
        dir = dir.toFile();
        var list = dir.listFiles();
        return Java.from(list).map(function (x) { return x.getName(); });
    };
    SettingStorage.settingDirectory = 'settings';
    return SettingStorage;
}());
var Setting = /** @class */ (function () {
    function Setting(data) {
        var _this = this;
        this.label = data.label;
        this.systemLabel = data.systemLabel;
        this.scriptName = data.scriptName;
        this.description = data.description;
        this.type = data.type;
        this.value = data.value;
        this.defaultValue = data.defaultValue;
        this.additionalData = data.additionalData;
        this.callback = function (c, itemEntries) {
            if (itemEntries === void 0) { itemEntries = []; }
            if (itemEntries.length == 0) {
                _this.setValue(c, _this.getData(c));
            }
            else {
                if (itemEntries[3] == 'reset') {
                    _this.resetValue(c);
                }
            }
        };
    }
    Object.defineProperty(Setting.prototype, "id", {
        get: function () {
            return "Setting." + this.scriptName + "." + this.systemLabel;
        },
        enumerable: false,
        configurable: true
    });
    Setting.prototype.serialize = function () {
        return {
            label: this.label,
            description: this.description,
            type: this.type,
            systemLabel: this.systemLabel,
            value: this.value,
            defaultValue: this.defaultValue,
            additionalData: this.additionalData,
        };
    };
    Setting.prototype.render = function (root) {
        var row = root.row(4);
        row.label(this.label).h(20).labelAnchor(0, 0.5);
        return row;
    };
    ;
    Setting.prototype.getValue = function () {
        return this.value;
    };
    Setting.prototype.setValue = function (c, value) {
        this.value = value;
        this.updateRender(c);
    };
    ;
    Setting.prototype.resetValue = function (c) {
        this.setValue(c, this.defaultValue);
    };
    return Setting;
}());
var SettingBoolean = /** @class */ (function (_super) {
    __extends(SettingBoolean, _super);
    function SettingBoolean(data) {
        return _super.call(this, data) || this;
    }
    SettingBoolean.prototype.render = function (root) {
        var row = root.row(4);
        row.toggle(this.label, this.value).id(this.id).h(20);
        row.current.tooltip(this.description).context('refresh', this.id + ".reset", 'Reset value to default', 0x9966cc);
        return row;
    };
    SettingBoolean.prototype.getData = function (c) {
        return c.player.UIContext.data.getBoolean(this.id);
    };
    SettingBoolean.prototype.updateRender = function (c) {
        var component = c.player.UIContext.get(this.id);
        component.state(this.value);
    };
    return SettingBoolean;
}(Setting));
var SettingInteger = /** @class */ (function (_super) {
    __extends(SettingInteger, _super);
    function SettingInteger(data) {
        return _super.call(this, data) || this;
    }
    SettingInteger.prototype.render = function (root) {
        var _a, _b;
        var row = _super.prototype.render.call(this, root);
        var trackpad = row.trackpad().integer().id(this.id).h(20).value(this.value);
        ((_a = this.additionalData) === null || _a === void 0 ? void 0 : _a.min) ? trackpad.min(this.additionalData.min) : null;
        ((_b = this.additionalData) === null || _b === void 0 ? void 0 : _b.max) ? trackpad.max(this.additionalData.max) : null;
        row.current.tooltip(this.description).context('refresh', this.id + ".reset", 'Reset value to default', 0x9966cc);
        return row;
    };
    SettingInteger.prototype.getData = function (c) {
        return c.player.UIContext.data.getInt(this.id);
    };
    SettingInteger.prototype.updateRender = function (c) {
        var component = c.player.UIContext.get(this.id);
        component.value(this.value);
    };
    return SettingInteger;
}(Setting));
var SettingDouble = /** @class */ (function (_super) {
    __extends(SettingDouble, _super);
    function SettingDouble(data) {
        return _super.call(this, data) || this;
    }
    SettingDouble.prototype.render = function (root) {
        var _a, _b;
        var row = _super.prototype.render.call(this, root);
        var trackpad = row.trackpad().id(this.id).h(20).value(this.value);
        ((_a = this.additionalData) === null || _a === void 0 ? void 0 : _a.min) ? trackpad.min(this.additionalData.min) : null;
        ((_b = this.additionalData) === null || _b === void 0 ? void 0 : _b.max) ? trackpad.max(this.additionalData.max) : null;
        row.current.tooltip(this.description).context('refresh', this.id + ".reset", 'Reset value to default', 0x9966cc);
        return row;
    };
    SettingDouble.prototype.getData = function (c) {
        return c.player.UIContext.data.getDouble(this.id);
    };
    SettingDouble.prototype.updateRender = function (c) {
        var component = c.player.UIContext.get(this.id);
        component.value(this.value);
    };
    return SettingDouble;
}(Setting));
var SettingString = /** @class */ (function (_super) {
    __extends(SettingString, _super);
    function SettingString(data) {
        return _super.call(this, data) || this;
    }
    SettingString.prototype.render = function (root) {
        var column = root.column(4);
        column.label(this.label).h(20).labelAnchor(0, 0.5);
        var row = column.row(4);
        row.textarea().id(this.id).h(this.value.length > 42 ? 60 : 30).label(this.value);
        row.current.tooltip(this.description).context('refresh', this.id + ".reset", 'Reset value to default', 0x9966cc);
        return row;
    };
    SettingString.prototype.getData = function (c) {
        return c.player.UIContext.data.getString(this.id);
    };
    SettingString.prototype.setValue = function (c, value) {
        this.value = value;
    };
    ;
    SettingString.prototype.updateRender = function (c) {
        var component = c.player.UIContext.get(this.id);
        component.label(this.value);
    };
    return SettingString;
}(Setting));
var SettingColorRGB = /** @class */ (function (_super) {
    __extends(SettingColorRGB, _super);
    function SettingColorRGB(data) {
        return _super.call(this, data) || this;
    }
    SettingColorRGB.prototype.render = function (root) {
        var row = _super.prototype.render.call(this, root);
        var layout = row.layout();
        layout.current.rxy(1, 0).anchor(0, 0).h(20);
        layout.textbox(this.getRGB(this.value)).rw(1, -20).h(20).id(this.id).maxLength(6);
        var graphics = layout.graphics().rx(1, -20).id(this.id + ".color");
        graphics.rect(Number("0xFF" + this.getRGB(this.value))).wh(20, 20);
        row.current.tooltip(this.description).context('refresh', this.id + ".reset", 'Reset value to default', 0x9966cc);
        return row;
    };
    SettingColorRGB.prototype.getData = function (c) {
        return Number("0x" + c.player.UIContext.data.getString(this.id));
    };
    SettingColorRGB.prototype.updateRender = function (c) {
        var graphics = c.player.UIContext.get(this.id + ".color");
        graphics.rect(Number("0xFF" + this.getRGB(this.value))).wh(20, 20);
    };
    SettingColorRGB.prototype.resetValue = function (c) {
        var component = c.player.UIContext.get(this.id);
        var rgb = this.getRGB(this.defaultValue);
        component.label(rgb);
        this.setValue(c, Number("0x" + rgb));
    };
    SettingColorRGB.prototype.getRGB = function (value) {
        var hex = value.toString(16);
        return ("000000" + hex).slice(-6);
    };
    return SettingColorRGB;
}(Setting));
var SettingColorARGB = /** @class */ (function (_super) {
    __extends(SettingColorARGB, _super);
    function SettingColorARGB(data) {
        return _super.call(this, data) || this;
    }
    SettingColorARGB.prototype.render = function (root) {
        var row = _super.prototype.render.call(this, root);
        var layout = row.layout();
        layout.current.rxy(1, 0).anchor(0, 0).h(20);
        layout.textbox(this.getARGB(this.value)).rw(1, -20).h(20).id(this.id).maxLength(8);
        var graphics = layout.graphics().rx(1, -20).id(this.id + ".color");
        graphics.rect(Number("0xFF" + this.getARGB(this.value).slice(-6))).wh(20, 20);
        row.current.tooltip(this.description).context('refresh', this.id + ".reset", 'Reset value to default', 0x9966cc);
        return row;
    };
    SettingColorARGB.prototype.getData = function (c) {
        return Number("0x" + c.player.UIContext.data.getString(this.id));
    };
    SettingColorARGB.prototype.updateRender = function (c) {
        var graphics = c.player.UIContext.get(this.id + ".color");
        graphics.rect(Number("0xFF" + this.getARGB(this.value).slice(-6))).wh(20, 20);
    };
    SettingColorARGB.prototype.resetValue = function (c) {
        var component = c.player.UIContext.get(this.id);
        var argb = this.getARGB(this.defaultValue);
        component.label(argb);
        this.setValue(c, Number("0x" + argb));
    };
    SettingColorARGB.prototype.getARGB = function (value) {
        var hex = value.toString(16);
        return ("00000000" + hex).slice(-8);
    };
    return SettingColorARGB;
}(Setting));
var SettingColorMC = /** @class */ (function (_super) {
    __extends(SettingColorMC, _super);
    function SettingColorMC(data) {
        var _this = _super.call(this, data) || this;
        _this.callback = function (c, itemEntries) {
            if (itemEntries === void 0) { itemEntries = []; }
            if (itemEntries.length == 0) {
                _this.setValue(c, _this.getData(c));
            }
            else if (itemEntries[3] == 'reset') {
                _this.resetValue(c);
            }
            else if (itemEntries[3] == 'pickColor') {
                _this.setValue(c, ColorMC[itemEntries[4]]);
            }
        };
        return _this;
    }
    SettingColorMC.prototype.render = function (root) {
        var row = _super.prototype.render.call(this, root);
        var layout = row.layout();
        layout.current.rxy(1, 0).anchor(0, 0).h(20);
        var graphics = layout.graphics().rx(1, -20).id(this.id + ".color");
        graphics.rect(-106, 0, 126, 20, 0x66000000);
        graphics.rect(Number("0xFF" + this.getRGB())).wh(20, 20);
        layout.label(this.getKey(this.value)).rw(1, -20).labelAnchor(0.5, 0.5).h(20).id(this.id + ".label");
        row.current.tooltip(this.description).context('refresh', this.id + ".reset", 'Reset value to default', 0x9966cc);
        for (var _i = 0, _a = Object.keys(ColorMC); _i < _a.length; _i++) {
            var i = _a[_i];
            row.current.context('material', this.id + ".pickColor." + i, i, Number("0x" + ColorMC[i][1]));
        }
        return row;
    };
    SettingColorMC.prototype.getData = function (c) {
        return "0x" + c.player.UIContext.data.getString(this.id);
    };
    SettingColorMC.prototype.updateRender = function (c) {
        var graphics = c.player.UIContext.get(this.id + ".color");
        graphics.rect(Number("0xFF" + this.getRGB())).wh(20, 20);
        var text = c.player.UIContext.get(this.id + ".label");
        text.label(this.getKey(this.value));
    };
    SettingColorMC.prototype.getRGB = function () {
        return this.value[1];
    };
    SettingColorMC.prototype.getValue = function () {
        return this.value[0];
    };
    SettingColorMC.prototype.getKey = function (value) {
        for (var i in ColorMC) {
            if (ColorMC[i][0] == value[0]) {
                return i;
            }
        }
        return '';
    };
    return SettingColorMC;
}(Setting));
var SettingEnum = /** @class */ (function (_super) {
    __extends(SettingEnum, _super);
    function SettingEnum(data) {
        var _this = _super.call(this, data) || this;
        _this.callback = function (c, itemEntries) {
            if (itemEntries === void 0) { itemEntries = []; }
            if (itemEntries.length == 0) {
                _this.setValue(c, _this.getData(c));
            }
            else if (itemEntries[3] == 'reset') {
                _this.resetValue(c);
            }
            else if (itemEntries[3] == 'pickEnum') {
                _this.setValue(c, itemEntries[4]);
            }
        };
        return _this;
    }
    SettingEnum.prototype.render = function (root) {
        var row = _super.prototype.render.call(this, root);
        var layout = row.layout();
        var graphics = layout.graphics().rx(1, -20);
        graphics.rect(-106, 0, 126, 20, 0x66000000);
        layout.label(this.value).id(this.id + ".enum").h(20).rxy(0.5, 0).labelAnchor(0.5, 0.5);
        row.current.tooltip(this.description).context('refresh', this.id + ".reset", 'Reset value to default', 0x9966cc);
        for (var _i = 0, _a = this.additionalData.enumList; _i < _a.length; _i++) {
            var entry = _a[_i];
            row.current.context('left_handle', this.id + ".pickEnum." + entry, entry);
        }
        return row;
    };
    SettingEnum.prototype.getData = function (c) {
        return c.player.UIContext.data.getString(this.id);
    };
    SettingEnum.prototype.updateRender = function (c) {
        var component = c.player.UIContext.get(this.id + ".enum");
        component.label(this.value);
    };
    return SettingEnum;
}(Setting));
var SettingPos = /** @class */ (function (_super) {
    __extends(SettingPos, _super);
    function SettingPos(data) {
        return _super.call(this, data) || this;
    }
    SettingPos.prototype.render = function (root) {
        var column = root.column(4);
        column.label(this.label).h(20).labelAnchor(0, 0.5);
        var posRow = column.row(4);
        for (var i in this.value) {
            posRow.trackpad().integer().id(this.id + "." + i).h(20).value(this.value[i]);
        }
        column.current.tooltip(this.description).context('refresh', this.id + ".reset", 'Reset value to default', 0x9966cc);
    };
    SettingPos.prototype.getData = function (c) {
        var arr = [];
        for (var i in this.value) {
            arr.push(c.player.UIContext.data.getInt(this.id + "." + i));
        }
        return arr;
    };
    SettingPos.prototype.updateRender = function (c) {
        for (var i in this.value) {
            c.player.UIContext.data.setInt(this.id + "." + i, this.value[i]);
            var component = c.player.UIContext.get(this.id + "." + i);
            component.value(this.value[i]);
        }
    };
    return SettingPos;
}(Setting));
var SettingArray = /** @class */ (function (_super) {
    __extends(SettingArray, _super);
    function SettingArray(data) {
        var _this = _super.call(this, data) || this;
        _this.callback = function (c, itemEntries) {
            if (itemEntries === void 0) { itemEntries = []; }
            if (itemEntries.length == 0) {
                c.player.closeUI();
                globalTLSETTINGS.currentSetting = _this.id;
                c.scheduleScript(c.script, 'TL_SETTINGS_ARRAY_UI', 1);
            }
            else {
                if (itemEntries[3] == 'reset') {
                    _this.resetValue(c);
                }
            }
        };
        return _this;
    }
    SettingArray.prototype.getData = function (c) {
        return this.value;
    };
    SettingArray.prototype.entryRender = function (root, entry, index) {
        var layout = root.layout();
        layout.current.h(20);
        layout.label(String(index)).h(20).rw(0.1).labelAnchor(0, 1).anchor(0, 0);
        var row = layout.row(4, 4);
        row.current.h(20).rw(0.9).anchor(1, 0).rx(1);
        row.current.context('refresh', "entry." + index + ".reset", 'Reset', 0x9966cc);
        row.current.context('copy', "entry." + index + ".copy", 'Copy', 0x6699cc);
        row.current.context('add', "entry." + index + ".add", 'Add', 0x66cc66);
        row.current.context('remove', "entry." + index + ".remove", 'Remove', 0xcc6666);
        if (this.additionalData.arrayType == SettingType.INTEGER) {
            row.trackpad(entry).integer().h(20).id("entry." + index);
        }
        if (this.additionalData.arrayType == SettingType.DOUBLE) {
            row.trackpad(entry).h(20).id("entry." + index);
        }
        if (this.additionalData.arrayType == SettingType.BOOLEAN) {
            row.toggle(String(index)).state(entry).h(20).id("entry." + index);
        }
        if (this.additionalData.arrayType == SettingType.STRING) {
            row.textarea(entry).h(20).id("entry." + index);
        }
        if (this.additionalData.arrayType == SettingType.COLOR_RGB) {
            var layout_1 = row.layout();
            layout_1.current.rxy(1, 0).anchor(0, 0).h(20);
            layout_1.textbox(("000000" + entry.toString(16)).slice(-6)).rw(1, -20).h(20).id("entry." + index).maxLength(6);
            var graphics = layout_1.graphics().rx(1, -20).id("entry." + index + ".color");
            graphics.rect(Number("0xFF" + ("000000" + entry.toString(16)).slice(-6))).wh(20, 20);
        }
        if (this.additionalData.arrayType == SettingType.COLOR_ARGB) {
            var layout_2 = row.layout();
            layout_2.current.rxy(1, 0).anchor(0, 0).h(20);
            layout_2.textbox(("00000000" + entry.toString(16)).slice(-8)).rw(1, -20).h(20).id("entry." + index).maxLength(8);
            var graphics = layout_2.graphics().rx(1, -20).id("entry." + index + ".color");
            graphics.rect(Number("0xFF" + ("000000" + entry.toString(16)).slice(-6))).wh(20, 20);
        }
        if (this.additionalData.arrayType == SettingType.COLOR_MC) {
            var layout_3 = row.layout();
            layout_3.current.rxy(1, 0).anchor(0, 0).h(20);
            layout_3.label(this.getKey(entry)).rw(1, -20).h(20).labelAnchor(0.5, 0.5).id("entry." + index).background(0xcc000000);
            var graphics = layout_3.graphics().rx(1, -20).id("entry." + index + ".color");
            graphics.rect(Number("0xFF" + ("000000" + entry[1].toString(16)).slice(-6))).wh(20, 20);
            for (var _i = 0, _a = Object.keys(ColorMC); _i < _a.length; _i++) {
                var i = _a[_i];
                row.current.context('material', "entry." + index + ".pickColor." + i, i, Number("0x" + ColorMC[i][1]));
            }
        }
        if (this.additionalData.arrayType == SettingType.ENUM) {
            row.label(entry).h(20).labelAnchor(0.5, 0.5).background(0xcc000000);
            for (var _b = 0, _c = this.additionalData.enumList; _b < _c.length; _b++) {
                var enumEntry = _c[_b];
                row.current.context('left_handle', "entry." + index + ".pickEnum." + enumEntry, enumEntry);
            }
        }
        if (this.additionalData.arrayType == SettingType.POS) {
            for (var i in entry) {
                row.trackpad().integer().h(20).value(entry[i]).id("entry." + index + "." + i);
            }
        }
    };
    SettingArray.prototype.getKey = function (value) {
        for (var i in ColorMC) {
            if (ColorMC[i][0] == value[0]) {
                return i;
            }
        }
        return '';
    };
    SettingArray.prototype.getEntryValue = function (context, id) {
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
            return Number("0x" + context.data.getString(id));
        }
        if (this.additionalData.arrayType == SettingType.COLOR_ARGB) {
            return Number("0x" + context.data.getString(id));
        }
        if (this.additionalData.arrayType == SettingType.COLOR_MC) {
            return null;
        }
        if (this.additionalData.arrayType == SettingType.ENUM) {
            return null;
        }
        if (this.additionalData.arrayType == SettingType.POS) {
            var arr = [];
            for (var i = 0; i < 3; i++) {
                arr.push(context.data.getInt(id + "." + i));
            }
            return arr;
        }
    };
    SettingArray.prototype.getEmpty = function () {
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
    };
    SettingArray.prototype.render = function (root) {
        var row = root.row(4);
        row.label(this.label).h(20).labelAnchor(0, 0.5);
        row.button("edit...(" + this.value.length + ")").id(this.id);
        row.current.tooltip(this.description).context('refresh', this.id + ".reset", 'Reset value to default', 0x9966cc);
        return row;
    };
    SettingArray.prototype.updateRender = function (c) {
        var component = c.player.UIContext.get(this.id);
        component.label("edit...(" + this.value.length + ")");
    };
    return SettingArray;
}(Setting));
