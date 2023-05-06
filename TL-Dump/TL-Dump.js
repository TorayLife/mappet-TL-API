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
var dumpedObject;
var lang;
var version = '1.0.0';
// @ts-ignore
function main(c) {
    Mappings.init();
    lang = new Localization(c);
    createDumpUI(c);
}
var lines = {
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
var Localization = /** @class */ (function () {
    function Localization(c) {
        var minecraftPlayer = c.player.minecraftPlayer;
        var field = minecraftPlayer.class.getDeclaredField('field_71148_cg'); //private 'language' field
        field.setAccessible(true);
        var lang = field.get(minecraftPlayer);
        this.object = lang == 'ru_ru' ? lines.ru_RU : lines.en_US;
    }
    Localization.prototype.get = function (key) {
        return this.object[key];
    };
    return Localization;
}());
var MemberSet = /** @class */ (function () {
    function MemberSet() {
        this.registry = {};
    }
    MemberSet.prototype.push = function (member) {
        this.registry[member.stringify(false)] = member;
    };
    MemberSet.prototype.filter = function (consumer) {
        var _this = this;
        return Object.keys(this.registry).map(function (key) { return _this.registry[key]; }).filter(function (value) { return consumer(value); });
    };
    return MemberSet;
}());
function dump(object) {
    var output = {
        fields: new MemberSet(),
        methods: new MemberSet(),
        classStack: [],
    };
    var clazz;
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
        var name_1 = clazz.getName();
        while (name_1 != 'java.lang.Object') {
            for (var _i = 0, _a = clazz.getDeclaredFields(); _i < _a.length; _i++) {
                var field = _a[_i];
                output.fields.push(new Field(field));
            }
            for (var _b = 0, _c = clazz.getDeclaredMethods(); _b < _c.length; _b++) {
                var method = _c[_b];
                output.methods.push(new Method(method));
            }
            name_1 = clazz.getName();
            output.classStack.unshift(name_1);
            clazz = clazz.getSuperclass();
        }
    }
    return output;
}
var Member = /** @class */ (function () {
    function Member(memberObject) {
        this.name = memberObject.getName();
        this.addModifiers(memberObject);
    }
    Member.prototype.addModifiers = function (memberObject) {
        this.modifiers = [];
        var Modifier = Java.type('java.lang.reflect.Modifier');
        var modifiers = memberObject.getModifiers();
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
    };
    Member.prototype.isStaticOrNotPublic = function () {
        var modifiers = this.modifiers;
        var isStatic = false;
        var isPublic = true;
        for (var _i = 0, modifiers_1 = modifiers; _i < modifiers_1.length; _i++) {
            var modifier = modifiers_1[_i];
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
    };
    return Member;
}());
var Field = /** @class */ (function (_super) {
    __extends(Field, _super);
    function Field(memberObject) {
        var _this = _super.call(this, memberObject) || this;
        _this.type = memberObject.getType().getSimpleName();
        return _this;
    }
    Field.prototype.stringify = function () {
        return this.type + ' ' + this.name;
    };
    return Field;
}(Member));
var Method = /** @class */ (function (_super) {
    __extends(Method, _super);
    function Method(memberObject) {
        var _this = _super.call(this, memberObject) || this;
        _this.parameters = [];
        _this.type = memberObject.getReturnType().getSimpleName();
        var params = Java.from(memberObject.getParameterTypes());
        params.forEach(function (clazz) { return _this.parameters.push(new MethodParameter(clazz)); });
        return _this;
    }
    Method.prototype.stringify = function (fullName) {
        var modifiersString = this.modifiers.length > 0 ? "\u00A7r[".concat(this.modifiers.join('\u00A7r;'), "\u00A7r]") : '';
        var returnString = this.type;
        var nameString = this.name;
        var parametersString = "(".concat(this.parameters.map(function (p) { return fullName ? p.className : p.name; }).join(', '), ")");
        return "".concat(modifiersString).concat(returnString, " ").concat(nameString).concat(parametersString);
    };
    return Method;
}(Member));
var MethodParameter = /** @class */ (function () {
    function MethodParameter(parameterClass) {
        this.className = parameterClass.getName();
        this.name = parameterClass.getSimpleName();
    }
    return MethodParameter;
}());
var MemberModifier;
(function (MemberModifier) {
    MemberModifier["STATIC"] = "\u00A77STATIC";
    MemberModifier["PRIVATE"] = "\u00A7cPRIVATE";
    MemberModifier["PROTECTED"] = "\u00A74PROTECTED";
    MemberModifier["PACKAGE_PRIVATE"] = "\u00A76PACKAGE-PRIVATE";
    MemberModifier["FINAL"] = "\u00A76FINAL";
})(MemberModifier || (MemberModifier = {}));
var Mappings = /** @class */ (function () {
    function Mappings() {
    }
    var _a;
    _a = Mappings;
    Mappings.mappingUrl = 'https://gist.githubusercontent.com/TorayLife/165840d8cca52bc25306dfc2ceb0c062/raw/2e48c3f257c4521122107a38ce2d6d0d6837df5d/1.12.2%2520mappings.txt';
    Mappings.url = Java.type('java.net.URL');
    Mappings.scanner = Java.type('java.util.Scanner');
    Mappings.mainDir = Java.type('net.minecraftforge.common.DimensionManager').getCurrentSaveRootDirectory().toPath();
    Mappings.path = Mappings.mainDir.resolve('mappet/scripts');
    Mappings.fileName = 'mappings-1_12_2.txt';
    Mappings.list = {};
    Mappings.init = function () {
        if (!Mappings.check()) {
            Mappings.downloadMappings();
        }
        if (!mappet.get('mappings')) {
            var file = Mappings.path.resolve(Mappings.fileName);
            var scanner = new Mappings.scanner(file);
            while (scanner.hasNext()) {
                var line = scanner.next().split(':');
                Mappings.list[line[0]] = line[1];
            }
            scanner.close();
            mappet.set('mappings', JSON.parse(JSON.stringify(Mappings.list)));
        }
        else {
            _a.list = mappet.get('mappings');
        }
    };
    Mappings.downloadMappings = function () {
        var url = new Mappings.url(Mappings.mappingUrl);
        var scanner = new Mappings.scanner(url.openStream());
        var NioFiles = Java.type('java.nio.file.Files');
        var file = Mappings.path.resolve(Mappings.fileName);
        if (!NioFiles.exists(file)) {
            file = NioFiles.createFile(file);
        }
        var string = '';
        while (scanner.hasNext()) {
            string += scanner.next() + '\n';
        }
        // @ts-ignore
        NioFiles.write(file, string.getBytes());
        scanner.close();
    };
    Mappings.check = function () { return Java.type('java.nio.file.Files').exists(Mappings.path.resolve(Mappings.fileName)); };
    return Mappings;
}());
var currentLayout = 'Fields';
var isPro = false;
function createDumpUI(c) {
    var root = mappet.createUI(c, 'handler').background();
    root.graphics().rx(0, 5).ry(0, 30).rw(0.55, -10).rh(0.34, -35).rect(0x88000000).rwh(1, 1);
    root.label(lang.get('replLabel')).rw(0.1).h(15).xy(5, 15).labelAnchor(0, 0.5).background(0x88000000);
    var replLogLayout = root.column(0);
    replLogLayout.current.scroll().rx(0, 10).ry(0, 35).rw(0.55, -15).rh(0.34, -45);
    replLogLayout.text('').rw(1).rh(1).id('replLog');
    root.label(lang.get('inputLabel')).rw(0.1).h(15).x(5).ry(0.33, 5).labelAnchor(0, 0.5).background(0x88000000);
    root.textarea().label('var player = c.player.minecraftPlayer; player').id('input').rx(0, 5).ry(0.33, 20)
        .rw(0.55, -10).rh(0.33, -5);
    new Callback('input').function = updatePreview;
    root.label(lang.get('inputPreviewLabel')).rw(0.1).h(15).x(5).ry(0.67, 15).labelAnchor(0, 0.5).background(0x88000000);
    root.graphics().anchorY(1).rx(0, 5).ry(1, -5).rw(0.55, -10).rh(0.33, -35).rect(0x88000000).rwh(1, 1);
    var textLayout = root.column(0);
    textLayout.current.anchorY(1).rx(0, 15).ry(1, -10).rw(0.55, -20).rh(0.33, -45);
    textLayout.current.scroll();
    textLayout.text('').id('inputPreview').rwh(1, 1);
    var buttonRow = root.row(4);
    buttonRow.current.anchor(1, 1).rx(1, -5).ry(1, -5).rw(0.45, -5).h(20);
    buttonRow.button('Dump').id('dumpButton').h(20);
    new Callback('dumpButton').setFunction(dumpPress);
    buttonRow.button('PRO: off').id('proButton').h(20).background(0x00FF44).tooltip(lang.get('proButton'));
    new Callback('proButton').setFunction(function (c) {
        isPro = !isPro;
        c.player.UIContext.get('proButton').background(isPro ? 0xFF6600 : 0x00FF44).label('Pro: ' + (isPro ? 'on' : 'off'));
        updateLists(c);
    });
    buttonRow.button('Fields').id('typeButton').h(20);
    new Callback('typeButton').function = function (c) {
        var context = c.player.UIContext;
        var otherId = currentLayout == 'Fields' ? 'Methods' : 'Fields';
        context.get(context.last).label(otherId);
        context.get(currentLayout.toLowerCase() + 'Layout').visible(false);
        context.get(otherId.toLowerCase() + 'Layout').visible(true);
        currentLayout = otherId;
        context.sendToPlayer();
    };
    buttonRow.button('About').id('aboutButton').h(20);
    new Callback('aboutButton').function = function (c) {
        var context = c.player.UIContext;
        context.get('aboutScreen').visible(true);
    };
    var searchLayout = root.layout();
    searchLayout.current.rx(1, -5).ry(0, 5).anchorX(1).rw(0.45, -5).h(20);
    searchLayout.textbox().maxLength(999999).rw(0.8).h(20).id('search');
    searchLayout.button(lang.get('search')).rw(0.2).h(20).rx(0.8).id('searchButton');
    new Callback('searchButton').function = updateLists;
    root.label('').rx(1, -5).ry(0, 33).anchorX(1)
        .id('classNameLabel').rw(0.45, -5).h(15).background(0x88000000);
    var fieldsLayout = root.layout();
    fieldsLayout.current.rx(1, -5).ry(0, 45).anchorX(1).id('fieldsLayout').rw(0.45, -5).rh(1, -75);
    fieldsLayout.stringList([]).background().id('fieldsList').rwh(1, 1).tooltip(lang.get('listDescription'), 3);
    fieldsLayout.stringList([]).background().id('fieldsListObf').visible(false);
    new Callback('fieldsList').function = chooseMember;
    var methodsLayout = root.layout();
    methodsLayout.current.rx(1, -5).ry(0, 45).anchorX(1).id('methodsLayout').rw(0.45, -5).rh(1, -75).visible(false);
    methodsLayout.stringList([]).background().id('methodsList').rwh(1, 1).tooltip(lang.get('listDescription'), 3);
    methodsLayout.stringList([]).background().id('methodsListObf').visible(false);
    new Callback('methodsList').function = chooseMember;
    pressMeToast(root);
    aboutScreen(root);
    c.player.openUI(root, true);
}
function pressMeToast(root) {
    var layout = root.layout();
    layout.current.rwh(1, 1).id('pressMeLayout');
    var graphics = layout.graphics();
    var color = 0xffffffff;
    graphics.anchor(1, 1).rx(0.55, 15).ry(1, -35).rw(0.15, -5).h(30);
    graphics.shadow(color, 0xff000000, 2).rwh(1, 1);
    var step = 1;
    var initialWidth = 8;
    var xOffset = -2;
    for (var i = initialWidth; i > 0; i -= step) {
        graphics.rect(color).wh(i, step).rx(1, -i + xOffset).ry(1, initialWidth - i);
    }
    layout.label(lang.get('pressMe')).wh(100, 15).ry(1, -60).rx(0.4, 25).color(0x000000, false);
}
function aboutScreen(root) {
    var layout = root.layout();
    layout.current.id('aboutScreen').rwh(1, 1).visible(false);
    var graphics = layout.graphics().rwh(1, 1);
    graphics.rect(0x88000000).rwh(1, 1);
    graphics.shadow(0x880088FF, 0x000088FF, 5).rwh(0.5, 0.5).rxy(0.25, 0.25);
    graphics.rect(0xff000000).rwh(0.5, 0.5).rxy(0.25, 0.25);
    layout.button('').noBackground().rwh(1, 1).tooltip('\u00A70 ');
    var textLayout = layout.column(0);
    textLayout.current.rwh(0.45, 0.45).rxy(0.5, 0.5).anchor(0.5);
    textLayout.text('\u00A77' + lang.get('description')).rwh(0.8, 0.8).rxy(0.5, 0.5).textAnchor(0.5).anchor(0.5);
    layout.icon('close').id('closeIcon').anchor(1, 1).wh(20, 20).rx(0.75).ry(0.25, 20);
    new Callback('closeIcon').function = function (c) {
        var context = c.player.UIContext;
        context.get('aboutScreen').visible(false);
    };
}
function chooseMember(c) {
    var context = c.player.UIContext;
    if (context.data.getString('input') == '') {
        return;
    }
    var obf = context.get(context.last + 'Obf').getValues()[context.data.getInt(context.last + '.index')];
    var memberName = obf.substring(obf.indexOf(' ') + 1, obf.length);
    var inputString = context.data.getString('input');
    var finalString = inputString + '.' + memberName;
    context.data.setString('input', finalString);
    context.get('input').label(finalString);
    updatePreview(c);
    context.sendToPlayer();
}
function updatePreview(c) {
    var context = c.player.UIContext;
    context.get('inputPreview').label(deobfuscateString(context.data.getString('input'), true));
}
function deobfuscateString(string, mark) {
    if (mark === void 0) { mark = false; }
    var regexp = /(field|func)_\d{5,6}_[a-zA-Z]{1,2}_?/gm;
    var prefix = mark ? '\u00A76' : '';
    var postfix = mark ? '\u00A7r' : '';
    return string.replace(regexp, function (obf) { return prefix + Mappings.list[obf] + postfix; });
}
function dumpPress(c) {
    var context = c.player.UIContext;
    var data = context.data;
    context.get('pressMeLayout').visible(false);
    if (!data.getString('input')) {
        return;
    }
    var print = function () {
        var objects = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            objects[_i] = arguments[_i];
        }
        var string = '';
        objects.forEach(function (obj) { return string += obj + '\n'; });
        var newString = data.getString('replLog') + string;
        context.get('replLog').label(newString);
        data.setString('replLog', newString);
    };
    try {
        var object = eval(data.getString('input'));
        dumpedObject = dump(object);
        print(object);
    }
    catch (err) {
        print(err);
    }
    context.get('classNameLabel').label(dumpedObject.classStack[dumpedObject.classStack.length - 1])
        .tooltip(dumpedObject.classStack.join('\n'));
    updateLists(c);
}
function updateLists(c) {
    var context = c.player.UIContext;
    context.get('fieldsListObf').values(['']);
    context.get('methodsListObf').values(['']);
    context.get('fieldsList').values(['']);
    context.get('methodsList').values(['']);
    updatePreview(c);
    var searchValue = context.data.getString('search');
    var fields = dumpedObject.fields
        .filter(function (f) {
        if (isPro) {
            return true;
        }
        return f.isStaticOrNotPublic();
    })
        .map(function (f) {
        return {
            obf: f.stringify(),
            deobf: deobfuscateString(f.stringify()),
        };
    });
    var methods = dumpedObject.methods
        .filter(function (f) {
        if (isPro) {
            return true;
        }
        return f.isStaticOrNotPublic();
    })
        .map(function (f) {
        return {
            obf: f.stringify(true),
            deobf: deobfuscateString(f.stringify(false)),
        };
    });
    if (searchValue) {
        fields = fields.filter(function (f) { return f.deobf.indexOf(searchValue) !== -1; });
        methods = methods.filter(function (f) { return f.deobf.indexOf(searchValue) !== -1; });
    }
    if (fields.length > 0) {
        context.get('fieldsListObf').values(fields.map(function (f) { return f.obf; }));
        context.get('fieldsList').values(fields.map(function (f) { return f.deobf; }));
    }
    if (methods.length > 0) {
        context.get('methodsListObf').values(methods.map(function (m) { return m.obf; }));
        context.get('methodsList').values(methods.map(function (m) { return m.deobf; }));
    }
}
