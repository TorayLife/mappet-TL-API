/*! TL-Logger
 * Version: 0.0.1
 * https://github.com/TorayLife/mappet-TL-API/tree/master/TL-Logger
 * Made by TorayLife (https://github.com/TorayLife)
 */
//region Library code
//TL-LOGGER
var Logger = /** @class */ (function () {
    function Logger() {
    }
    Logger.getLogsPath = function () {
        var storage = new SettingStorage('TL-LOGGER');
        return storage.get('path', 'Path', 'Path to store all logs files.', SettingType.STRING, 'customLogs');
    };
    Logger.getUTC = function () {
        var storage = new SettingStorage('TL-LOGGER');
        return storage.get('utc', 'UTC offset', 'Your local time zone. for example, GMT+3 will be equal to 3.', SettingType.INTEGER, 0);
    };
    Logger.info = function (c, message) {
        this.log(c, message, 'INFO');
    };
    Logger.debug = function (c, message) {
        this.log(c, message, 'DEBUG');
    };
    Logger.error = function (c, message) {
        this.log(c, message, 'ERROR');
    };
    Logger.log = function (c, message, type) {
        var storage = new SettingStorage('TL-LOGGER');
        var sendList = storage.get('receiverList', 'Receiver list', 'If true, will send log to any player in array above.', SettingType.ARRAY, ['Sir_Toray_Life'], {
            arrayType: SettingType.STRING,
        });
        var isSend = storage.get('sendToReceiverList', 'Send to Receivers', 'If true, will send log to any player in receiver list', SettingType.BOOLEAN, false);
        var date = new Date();
        date.setTime(date.getTime());
        var path = this.getLogsPath() + "/" + date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
        if (!FileLib.has(path, c.script + ".json")) {
            FileLib.create(path, c.script + ".json");
            var file_1 = FileLib.get(path, c.script + ".json");
            FileLib.write(file_1, []);
        }
        var file = FileLib.get(path, c.script + ".json");
        var fileData = FileLib.read(file);
        var log = new logEntry(type, c, message);
        if (isSend) {
            var allPlayers = Java.from(c.server.allPlayers);
            allPlayers.forEach(function (player) {
                if (sendList.indexOf(player.name) !== -1) {
                    player.send(log.toString());
                }
            });
        }
        fileData.push(log.getData());
        FileLib.write(file, fileData);
    };
    Logger.getLogs = function (fileName, date) {
        var path = this.getLogsPath() + "/" + date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
        if (!FileLib.has(path, fileName + ".json")) {
            FileLib.create(path, fileName + ".json");
            var file_2 = FileLib.get(path, fileName + ".json");
            FileLib.write(file_2, []);
        }
        var file = FileLib.get(path, fileName + ".json");
        var fileData = FileLib.read(file);
        return fileData.map(function (entry) {
            return entry;
        });
    };
    return Logger;
}());
var logEntry = /** @class */ (function () {
    function logEntry(type, c, message) {
        var _a, _b, _c, _d;
        var date = new Date();
        date.setTime(date.getTime() + Logger.getUTC() * 60 * 60 * 1000);
        var s = (_a = c === null || c === void 0 ? void 0 : c.subject) !== null && _a !== void 0 ? _a : null;
        var subject;
        if (s) {
            subject = {
                name: s.name,
                uuid: s.uniqueId,
                x: s.position.x,
                y: s.position.y,
                z: s.position.z,
            };
        }
        var o = (_b = c === null || c === void 0 ? void 0 : c.object) !== null && _b !== void 0 ? _b : null;
        var object;
        if (o) {
            object = {
                name: o.name,
                uuid: o.uniqueId,
                x: o.position.x,
                y: o.position.y,
                z: o.position.z,
            };
        }
        this.data = {
            date: date.getTime(),
            script: (_c = c === null || c === void 0 ? void 0 : c.script) !== null && _c !== void 0 ? _c : 'unknown',
            function: (_d = c === null || c === void 0 ? void 0 : c.function) !== null && _d !== void 0 ? _d : 'unknown',
            subject: subject,
            object: object,
            type: type,
            message: message.stack ? message.stack : message,
        };
    }
    logEntry.getFromJS = function (js, c) {
        var log = new logEntry('', c, '');
        log.data = js;
        return log;
    };
    logEntry.prototype.getData = function () {
        return this.data;
    };
    logEntry.prototype.toString = function () {
        var date = "" + new Date(this.data.date).toISOString().replace('T', ' ').slice(0, -5);
        var logType = '';
        if (this.data.type == 'INFO') {
            logType = '\u00A72INFO';
        }
        if (this.data.type == 'DEBUG') {
            logType = '\u00A79DEBUG';
        }
        if (this.data.type == 'ERROR') {
            logType = '\u00A74ERROR';
        }
        var logText = "\u00A77\\[" + date + "\u00A77]" +
            ("\\[" + this.data.script + ": " + this.data.function + "]") +
            ("\\[" + logType + "\u00A77]: \u00A7f" + ((this.data.type == 'ERROR' ? '\u00A7c' : '') + this.data.message));
        return logText;
    };
    return logEntry;
}());
var TL_LoggerCallbacks = {};
//endregion
//region Mappet functions
// @ts-ignore
function main(c) {
    try {
        Task
            .define(function () {
            Logger.info(c, c.player.name + " open a Logger!");
            createUI(c);
        })
            .then(function () {
            fillLogs(c);
        });
    }
    catch (e) {
        Logger.error(c, e);
    }
}
function TL_LoggerHandler(c) {
    try {
        var context = c.player.UIContext;
        var last = context.last;
        if (last && TL_LoggerCallbacks[last]) {
            TL_LoggerCallbacks[last].function(c, last);
            if (TL_LoggerCallbacks[last].update) {
                updateUI(c);
            }
        }
        if (last == '' && context.context && TL_LoggerCallbacks[context.context]) {
            TL_LoggerCallbacks[context.context].function(c, context.context);
            if (TL_LoggerCallbacks[context.context].update) {
                updateUI(c);
            }
        }
        if (context.hotkey == 'F5' || last == 'form') {
            saveContext(c.player, context.data);
        }
        if (context.isClosed() && last == '') {
            saveContext(c.player, context.data);
        }
        else if (!TL_LoggerCallbacks[last] && !TL_LoggerCallbacks[context.context]) {
            updateUI(c);
        }
    }
    catch (e) {
        Logger.error(c, e);
    }
}
//endregion
//region Forming a UI modules
function createUI(c, show) {
    if (show === void 0) { show = true; }
    try {
        var thisStorage = new SettingStorage('TL-LOGGER');
        var debug = thisStorage.get('debug', 'Debug', 'Print debug logs when open UI.', SettingType.BOOLEAN, false);
        if (debug) {
            Logger.debug(c, 'Logger must work!');
            Logger.debug(c, 'This is a very very long debug log! This is a very very long debug log! This is a very very long debug log!' +
                ' This is a very very long debug log! This is a very very long debug log! This is a very very long debug log! This is a very' +
                ' very long debug log! This is a very very long debug log! This is a very very long debug log! This is a very very long' +
                ' debug log! This is a very very long debug log! This is a very very long debug log! This is a very very long debug log!');
        }
        c.setValue('data', getContext(c.player));
        var root = mappet.createUI(c, 'TL_LoggerHandler').background();
        var baseUI = formBaseUI(root, c);
        var logOptionsUI = formLogOptionsUI(root, c);
        if (show) {
            c.player.openUI(root, true);
        }
    }
    catch (e) {
        Logger.error(c, e);
    }
}
function formBaseUI(root, c) {
    var baseLayout = root.layout();
    baseLayout.current.rwh(1, 1).id('baseLayout');
    //baseLayout.current.keybind(63, 'F5', 'F5');
    formFileToggles(baseLayout, c);
    formTypeToggles(baseLayout, c);
    var layout = baseLayout.layout();
    layout.current.rx(0.2, 20).rwh(0.75, 1);
    formEmptyLogs(layout, c);
    formAbove(layout, c);
    formUnder(layout);
    return baseLayout;
}
function formLogOptionsUI(root, c) {
    var logOptionsLayout = root.layout();
    logOptionsLayout.current.rwh(1, 1).id('logOptionsLayout').enabled(false).visible(false).tooltip('\u00A70.');
    //background shading
    var graphic = logOptionsLayout.graphics();
    graphic.rwh(1, 1).rxy(0, 0);
    graphic.rect(-100, -100, 8000, 8000, 0xcc000000);
    //options
    var column = logOptionsLayout.column(4, 10);
    column.current.rwh(0.8, 0.8).rxy(0.5, 0.5).anchor(0.5, 0.5);
    var entitesRow = column.row(4, 10);
    entitesRow.current.rh(0.5);
    var subjectCol = entitesRow.column(4);
    subjectCol.label('==SUBJECT==').h(20).labelAnchor(0.5, 0.5);
    subjectCol.label('==').id('options.subject.status').h(20).labelAnchor(0.5, 0.5);
    subjectCol.label('Name:').h(20).labelAnchor(0, 0.5);
    subjectCol.textbox('').h(20).id('options.subject.name').maxLength(100);
    subjectCol.label('UUID:').h(20).labelAnchor(0, 0.5);
    subjectCol.textbox('').h(20).id('options.subject.uuid').maxLength(100);
    subjectCol.label('Coords:').h(20).labelAnchor(0, 0.5);
    subjectCol.textbox('').h(20).id('options.subject.pos').maxLength(100);
    subjectCol.button('TP to ').h(20).id('options.subject.tp');
    var objectRow = entitesRow.column(4);
    objectRow.label('==OBJECT==').h(20).labelAnchor(0.5, 0.5);
    objectRow.label('==').id('options.object.status').h(20).labelAnchor(0.5, 0.5);
    objectRow.label('Name:').h(20).labelAnchor(0, 0.5);
    objectRow.textbox('').h(20).id('options.object.name').maxLength(100);
    objectRow.label('UUID:').h(20).labelAnchor(0, 0.5);
    objectRow.textbox('').h(20).id('options.object.uuid').maxLength(100);
    objectRow.label('Coords:').h(20).labelAnchor(0, 0.5);
    objectRow.textbox('').h(20).id('options.object.pos').maxLength(100);
    objectRow.button('TP to ').h(20).id('options.object.tp');
    var returnRow = column.row(4, 40);
    returnRow.button('return').wh(120, 20).id('logOptionsLayout.return');
    addCallback('logOptionsLayout.return', function (c, elementId) {
        var context = c.player.UIContext;
        context.get('baseLayout').enabled(true);
        context.get('logOptionsLayout').enabled(false).visible(false);
    }, false);
}
function formEmptyLogs(root, c) {
    try {
        var thisStorage = new SettingStorage('TL-LOGGER');
        var logLimit = thisStorage.get('logLimit', 'Limit of logs', 'How many log entries can be rendered at the same time', SettingType.INTEGER, 200, {
            min: 50,
            max: 200,
        });
        var logList = root.column(0, 5);
        logList.current.ry(0.06).rwh(1, 0.88).scroll();
        for (var i = 0; i < logLimit; i++) {
            var row = logList.layout();
            row.current.h(0).visible(false).margin(0).id("log.layout." + i).rw(1);
            var text = row.text('');
            text.h(0).visible(false).margin(0).id("log.label." + i).rw(1);
            row.current.context('download', "log.more." + i, 'More...', 0x474389);
            addCallback("log.more." + i, function (c, elementId) {
                var context = c.player.UIContext;
                context.get('baseLayout').enabled(false);
                context.get('logOptionsLayout').enabled(true).visible(true);
            }, false);
        }
    }
    catch (e) {
        Logger.error(c, e);
    }
}
function formAbove(root, c) {
    try {
        var above = root.layout();
        above.current.rwh(1, 0.06).ry(0, 10);
        var data = getContext(c.player);
        var fromAtoZ = data.getBoolean('dateSortAtoZ');
        above.label(!fromAtoZ ? 'Date: from A to Z' : 'Date: from Z to A').id('dateSort').h(16).w(150).background(0x66000000).labelAnchor(0, 0.5);
        above.icon(fromAtoZ ? 'move_down' : 'move_up').id('dateSort.icon').wh(16, 16).x(90);
        addCallback('dateSort.icon', function (c, elementId) {
            var data = getContext(c.player);
            var sortAtoZ = !data.getBoolean('dateSortAtoZ');
            data.setBoolean('dateSortAtoZ', sortAtoZ);
            saveContext(c.player, data);
            c.player.UIContext.get('dateSort').label(!sortAtoZ ? 'Date: from A to Z' : 'Date: from Z to A');
            c.player.UIContext.get('dateSort.icon').icon(sortAtoZ ? 'move_down' : 'move_up');
        });
        var searchRegex = data.getBoolean('search.modeRegex');
        above.toggle('Search in names:').state(data.getBoolean('search.names')).id('search.names').wh(125, 16).anchorX(1).rx(1, -370);
        above.label('Search:').labelAnchor(0, 0.5).wh(65, 16).anchorX(1).rx(1, -300);
        above.textbox(data.getString('searchbar')).wh(300, 16).id('searchbar').rx(1, -20).anchorX(1).updateDelay(500).tooltip(searchRegex ? 'Using' +
            ' regex to search' : 'Normal search').color(searchRegex ? 0x99ff99 : 0xffffff);
        above.icon(searchRegex ? 'graph' : 'bubble').id('search.mode').wh(16, 16).rx(1).anchorX(1).tooltip(searchRegex ? 'Using regex to' +
            ' search' : 'Normal search');
        addCallback('search.mode', function (c, elementId) {
            var data = getContext(c.player);
            var searchRegex = !data.getBoolean('search.modeRegex');
            data.setBoolean('search.modeRegex', searchRegex);
            saveContext(c.player, data);
            c.player.UIContext.get(elementId).icon(searchRegex ? 'graph' : 'bubble').tooltip(searchRegex ? 'Using regex to search' : 'Normal search');
            c.player.UIContext.get('searchbar').tooltip(searchRegex ? 'Using regex to search' : 'Normal search').color(searchRegex ? 0x99ff99 : 0xffffff);
        });
    }
    catch (e) {
        Logger.error(c, e);
    }
}
function formUnder(root) {
    var under = root.layout();
    under.current.rwh(1, 0.06).rxy(0, 1).anchor(0, 1);
    under.button('Form log list').h(20).rw(0.8).id('form').background(0x474389);
    under.label('').rxy(1, 0).labelAnchor(1, 0.5).anchor(1, 0).rw(0.2).h(20).id('counter');
    under.trackpad().integer().id('logPage').rx(0.8, 4).ry(0).wh(60, 20).tooltip('Page of' +
        ' logger').min(1).updateDelay(1000);
}
function formFileToggles(root, c) {
    var data = c.getValue('data');
    var fileList = getFiles();
    var fileTogglesLayout = root.layout();
    fileTogglesLayout.current.rwh(0.2, 0.5).rx(0, 10).ry(0, 0);
    var fileTogglesList = fileTogglesLayout.column(4);
    fileTogglesList.current.rwh(1, 1).scroll().scrollSize(0.05);
    var elem = fileTogglesList.toggle("All").h(20).id("toggleList.All");
    elem.state(data ? data.getBoolean("toggleList.All") : true);
    addCallback("toggleList.All", function (c, elementId) {
        var togglesList = fileList.map(function (file) {
            return "toggleList." + file.replace('.json', '');
        });
        var context = c.player.UIContext;
        for (var _i = 0, togglesList_1 = togglesList; _i < togglesList_1.length; _i++) {
            var toggle = togglesList_1[_i];
            context.get(toggle).enabled(!context.data.getBoolean(elementId));
        }
    });
    for (var _i = 0, fileList_1 = fileList; _i < fileList_1.length; _i++) {
        var fileName = fileList_1[_i];
        var file = fileName.replace('.json', '');
        var elem_1 = fileTogglesList.toggle(file).h(20).id("toggleList." + file);
        elem_1.state(data ? data.getBoolean("toggleList." + file) : false).enabled(data ? !data.getBoolean('toggleList.All') : false);
    }
}
function formTypeToggles(root, c) {
    var data = c.getValue('data');
    var rememberPeriod = data ? data.getBoolean('period') : false;
    var typeTogglesLayout = root.layout();
    typeTogglesLayout.current.rwh(0.2, 0.5).rx(0, 10).ry(1, -10).anchor(0, 1);
    var typeTogglesList = typeTogglesLayout.column(4);
    typeTogglesList.current.rwh(1, 1).anchor(0, 1).rxy(0, 1);
    typeTogglesList.label('Types:').h(10);
    typeTogglesList.toggle('[2INFO').id('typeList.info').h(20).state(data ? data.getBoolean('typeList.info') : true);
    typeTogglesList.toggle('[9DEBUG').id('typeList.debug').h(20).state(data ? data.getBoolean('typeList.debug') : true);
    typeTogglesList.toggle('[4ERROR').id('typeList.error').h(20).state(data ? data.getBoolean('typeList.error') : true);
    var startDate = new Date(0);
    if (data && rememberPeriod) {
        startDate = new Date(data.getInt('startDate.year'), data.getInt('startDate.month') - 1, data.getInt('startDate.day'), data.getInt('startDate.hour') + Logger.getUTC(), data.getInt('startDate.minutes'), data.getInt('startDate.seconds'));
    }
    dateElement(typeTogglesList, 'Period start:', 'startDate', startDate);
    var endDate = new Date();
    endDate.setTime(endDate.setUTCHours(23, 59, 59, 999));
    if (data && rememberPeriod) {
        endDate = new Date(data.getInt('endDate.year'), data.getInt('endDate.month') - 1, data.getInt('endDate.day'), data.getInt('endDate.hour') + Logger.getUTC(), data.getInt('endDate.minutes'), data.getInt('endDate.seconds'));
    }
    dateElement(typeTogglesList, 'Period end:', 'endDate', endDate);
    typeTogglesList.toggle('Remember period').id('period').state(data ? data.getBoolean('period') : false).h(20);
    typeTogglesList.label('\u00A7cWait...').id('status').labelAnchor(0.5).h(20).background(0xcc000000);
}
function dateElement(root, label, dateId, defaultDate) {
    var column = root.column(2);
    column.current.context('file', dateId + ".now", 'Now', 0x474389);
    column.current.context('leftload', dateId + ".dayStart", 'Day start', 0x474389);
    column.current.context('rightload', dateId + ".dayEnd", 'Day end', 0x474389);
    addCallback(dateId + ".now", function (c, elementId) {
        var context = c.player.UIContext;
        var date = new Date();
        var day = date.getUTCDate();
        var month = date.getUTCMonth() + 1;
        var year = date.getUTCFullYear();
        var hour = date.getUTCHours() + Logger.getUTC();
        var minutes = date.getUTCMinutes();
        var seconds = date.getUTCSeconds();
        var dateId = elementId.split('.')[0];
        context.get(dateId + ".day").value(day);
        context.get(dateId + ".month").value(month);
        context.get(dateId + ".year").value(year);
        context.get(dateId + ".hour").value(hour);
        context.get(dateId + ".minutes").value(minutes);
        context.get(dateId + ".seconds").value(seconds);
        context.data.setInt(dateId + ".day", day);
        context.data.setInt(dateId + ".month", month);
        context.data.setInt(dateId + ".year", year);
        context.data.setInt(dateId + ".hour", hour);
        context.data.setInt(dateId + ".minutes", minutes);
        context.data.setInt(dateId + ".seconds", seconds);
    });
    addCallback(dateId + ".dayStart", function (c, elementId) {
        var context = c.player.UIContext;
        context.get(dateId + ".hour").value(0);
        context.get(dateId + ".minutes").value(0);
        context.get(dateId + ".seconds").value(0);
        context.data.setInt(dateId + ".hour", 0);
        context.data.setInt(dateId + ".minutes", 0);
        context.data.setInt(dateId + ".seconds", 0);
    });
    addCallback(dateId + ".dayEnd", function (c, elementId) {
        var context = c.player.UIContext;
        context.get(dateId + ".hour").value(23);
        context.get(dateId + ".minutes").value(59);
        context.get(dateId + ".seconds").value(59);
        context.data.setInt(dateId + ".hour", 23);
        context.data.setInt(dateId + ".minutes", 59);
        context.data.setInt(dateId + ".seconds", 59);
    });
    column.label(label).h(10).marginTop(4);
    var row = column.row(2);
    row.trackpad().limit(1, 31).integer().h(15).value(defaultDate.getUTCDate()).id(dateId + ".day").updateDelay(800);
    row.trackpad().limit(1, 12).integer().h(15).value(defaultDate.getUTCMonth() + 1).id(dateId + ".month").updateDelay(800);
    row.trackpad().limit(1970, 4200).integer().h(15).value(defaultDate.getUTCFullYear()).id(dateId + ".year").updateDelay(800);
    var row2 = column.row(2);
    row2.trackpad().limit(0, 23).integer().h(15).value(defaultDate.getUTCHours()).id(dateId + ".hour").updateDelay(800);
    row2.trackpad().limit(0, 59).integer().h(15).value(defaultDate.getUTCMinutes()).id(dateId + ".minutes").updateDelay(800);
    row2.trackpad().limit(0, 59).integer().h(15).value(defaultDate.getUTCSeconds()).id(dateId + ".seconds").updateDelay(800);
}
//endregion
//region Work with logs
function clearLogs(c, limit) {
    try {
        var context = c.player.UIContext;
        for (var i = 0; i < limit; i++) {
            context.get("log.layout." + i).h(0).visible(false).margin(0);
            context.get("log.label." + i).h(0).visible(false).margin(0);
        }
    }
    catch (e) {
        Logger.error(c, e);
    }
}
function fillLogs(c) {
    var _a, _b, _c, _d, _e, _f;
    try {
        var context = c.player.UIContext;
        context.get('status').label('\u00A7cWait...');
        context.sendToPlayer();
        saveContext(c.player, context.data);
        c.setValue('data', getContext(c.player));
        var thisStorage = new SettingStorage('TL-LOGGER');
        var logLimit = thisStorage.get('logLimit', 'Limit of logs', 'How many log entries can be rendered at the same time', SettingType.INTEGER, 200, {
            min: 50,
            max: 200,
        });
        clearLogs(c, logLimit);
        var logs = getLogsWithSelections(c);
        var _loop_1 = function (i) {
            var log = logs[i];
            if (i >= logLimit) {
                return "break";
            }
            var layout = context.get("log.layout." + i);
            var text = context.get("log.label." + i);
            text.h(20).visible(true).margin(4);
            var logText = logEntry.getFromJS(log, c).toString();
            var tooltip = "[7Subject:\n";
            var s = log.subject;
            var o = log.object;
            if (s) {
                tooltip += "[7Name:\n  [e" + s.name + "\n";
                tooltip += "[7At:\n  [e" + ((_a = s.x) === null || _a === void 0 ? void 0 : _a.toFixed(3)) + " " + ((_b = s.y) === null || _b === void 0 ? void 0 : _b.toFixed(3)) + " " + ((_c = s.z) === null || _c === void 0 ? void 0 : _c.toFixed(3)) + "\n";
            }
            else {
                tooltip += 'null';
            }
            tooltip += '[7============\nObject:\n';
            if (o) {
                tooltip += "[7Name:\n  [e" + o.name + "\n";
                tooltip += "[7At:\n  [e" + ((_d = o.x) === null || _d === void 0 ? void 0 : _d.toFixed(3)) + " " + ((_e = o.y) === null || _e === void 0 ? void 0 : _e.toFixed(3)) + " " + ((_f = o.z) === null || _f === void 0 ? void 0 : _f.toFixed(3)) + "\n";
            }
            else {
                tooltip += 'null';
            }
            text.label(logText);
            text.tooltip(tooltip);
            var textWithoutColor = logText.replace(new RegExp('\u00A7.', 'g'), '');
            var height = (textWithoutColor.length / 140) > 1 ? 20 + 11 * (Math.round(textWithoutColor.length / 140)) : 20;
            layout.h(height).visible(true).margin(4);
            addCallback("log.more." + i, function (c, elementId) {
                var _a, _b;
                var context = c.player.UIContext;
                context.get('baseLayout').enabled(false);
                context.get('logOptionsLayout').enabled(true).visible(true);
                var subjectEntity;
                var subjectName;
                var subjectUUID;
                var subjectPos;
                if (s) {
                    subjectEntity = (_a = c.server) === null || _a === void 0 ? void 0 : _a.getEntity(s.uuid);
                    subjectName = s.name;
                    subjectUUID = s.uuid;
                    subjectPos = s.x.toFixed(3) + " " + s.y.toFixed(3) + " " + s.z.toFixed(3);
                }
                var color = subjectEntity ? "\u00A7a" : "\u00A7c";
                var online = subjectEntity ? "Online" : "Offline";
                var type = (subjectEntity === null || subjectEntity === void 0 ? void 0 : subjectEntity.isPlayer()) ? 'Player' : 'Entity';
                var status = color + "Status: " + online + "(" + type + ")";
                context.get('options.subject.status').label(status);
                context.get('options.subject.name').label(subjectName !== null && subjectName !== void 0 ? subjectName : '');
                context.get('options.subject.uuid').label(subjectUUID !== null && subjectUUID !== void 0 ? subjectUUID : '');
                context.get('options.subject.pos').label(subjectPos !== null && subjectPos !== void 0 ? subjectPos : '');
                context.get('options.subject.tp').label("TP to: " + subjectName).enabled(s);
                var objectEntity;
                var objectName;
                var objectUUID;
                var objectPos;
                if (o) {
                    objectEntity = (_b = c.server) === null || _b === void 0 ? void 0 : _b.getEntity(o.uuid);
                    objectName = o.name;
                    objectUUID = o.uuid;
                    objectPos = o.x.toFixed(3) + " " + o.y.toFixed(3) + " " + o.z.toFixed(3);
                }
                color = objectEntity ? "\u00A7a" : "\u00A7c";
                online = objectEntity ? "Online" : "Offline";
                type = (objectEntity === null || objectEntity === void 0 ? void 0 : objectEntity.isPlayer()) ? 'Player' : 'Entity';
                status = color + "Status: " + online + "(" + type + ")";
                context.get('options.object.status').label(status);
                context.get('options.object.name').label(objectName !== null && objectName !== void 0 ? objectName : '');
                context.get('options.object.uuid').label(objectUUID !== null && objectUUID !== void 0 ? objectUUID : '');
                context.get('options.object.pos').label(objectPos !== null && objectPos !== void 0 ? objectPos : '');
                context.get('options.object.tp').label("TP to: " + objectName).enabled(o);
                addCallback('options.subject.tp', function (c, elementId) {
                    var x = s.x;
                    var y = s.y;
                    var z = s.z;
                    if (x == undefined || y == undefined || z == undefined || c.server.getEntity(s.uuid) == undefined) {
                        c.player.UIContext.get('options.subject.tp').label("\u00A7cCan't tp to this entity...");
                        c.player.UIContext.sendToPlayer();
                        Task.define(function () {
                            c.player.UIContext.get('options.subject.tp').label("TP to: " + s.name);
                            c.player.UIContext.sendToPlayer();
                        }, 2000);
                    }
                    c.player.setPosition(x, y, z);
                    c.player.UIContext.get('options.subject.tp').label("\u00A7aTeleported");
                    c.player.UIContext.sendToPlayer();
                    Task.define(function () {
                        c.player.UIContext.get('options.subject.tp').label("TP to: " + s.name);
                        c.player.UIContext.sendToPlayer();
                    }, 2000);
                }, false);
                addCallback('options.object.tp', function (c, elementId) {
                    var x = o.x;
                    var y = o.y;
                    var z = o.z;
                    if (x == undefined || y == undefined || z == undefined || c.server.getEntity(o.uuid) == undefined) {
                        c.player.UIContext.get('options.object.tp').label("\u00A7cCan't tp to this entity...");
                        c.player.UIContext.sendToPlayer();
                        Task.define(function () {
                            c.player.UIContext.get('options.object.tp').label("TP to: " + o.name);
                            c.player.UIContext.sendToPlayer();
                        }, 2000);
                    }
                    else {
                        c.player.setPosition(x, y, z);
                        c.player.UIContext.get('options.object.tp').label("\u00A7aTeleported");
                        c.player.UIContext.sendToPlayer();
                        Task.define(function () {
                            c.player.UIContext.get('options.object.tp').label("TP to: " + o.name);
                            c.player.UIContext.sendToPlayer();
                        }, 2000);
                    }
                }, false);
            }, false);
        };
        for (var i in logs) {
            var state_1 = _loop_1(i);
            if (state_1 === "break")
                break;
        }
        context.get('status').label('\u00A7aLogs loaded!');
        context.sendToPlayer();
    }
    catch (e) {
        Logger.error(c, e);
    }
}
function getLogsWithSelections(c) {
    var data = c.getValue('data');
    var fileList = getFiles();
    var filteredByFiles = getLogsFromChoosedFiles(c, fileList);
    var dataInfo = data.getBoolean('typeList.info');
    var dataDebug = data.getBoolean('typeList.debug');
    var dataError = data.getBoolean('typeList.error');
    var startDate = getDate(c, 'startDate');
    startDate.setTime(startDate.getTime() + (data.getInt('startDate.hour') + Logger.getUTC()) * 60 * 60 * 1000);
    startDate.setTime(startDate.getTime() + data.getInt('startDate.minutes') * 60 * 1000);
    startDate.setTime(startDate.getTime() + data.getInt('startDate.seconds') * 1000);
    var startTime = startDate.getTime();
    var endDate = getDate(c, 'endDate');
    endDate.setTime(endDate.getTime() + (data.getInt('endDate.hour') + Logger.getUTC()) * 60 * 60 * 1000);
    endDate.setTime(endDate.getTime() + data.getInt('endDate.minutes') * 60 * 1000);
    endDate.setTime(endDate.getTime() + data.getInt('endDate.seconds') * 1000);
    var endTime = endDate.getTime();
    var sortFromAtoZ = data.getBoolean('dateSortAtoZ');
    var filtered = filteredByFiles.filter(function (entry) {
        var info = entry.type == 'INFO' && dataInfo;
        var debug = entry.type == 'DEBUG' && dataDebug;
        var error = entry.type == 'ERROR' && dataError;
        var byType = info || debug || error;
        var byTime = startTime <= entry.date && endTime >= entry.date;
        return byType && byTime;
    });
    var sorted = filtered.sort(function (a, b) {
        if (sortFromAtoZ) {
            return b.date - a.date;
        }
        else {
            return a.date - b.date;
        }
    }).filter(function (entry) {
        var _a, _b;
        var message = entry.message;
        if (data.getBoolean('search.names')) {
            message = message.concat('↨', (_a = entry.subject) === null || _a === void 0 ? void 0 : _a.name).concat('↨', (_b = entry.object) === null || _b === void 0 ? void 0 : _b.name);
        }
        if (data.getBoolean('search.modeRegex')) {
            return message.match(new RegExp(data.getString('searchbar'))) != null;
        }
        else {
            return message.indexOf(data.getString('searchbar')) !== -1;
        }
    }).map(function (entry) {
        var regex = data.getBoolean('search.modeRegex');
        var searchString = data.getString('searchbar');
        entry.message = entry.message.replace(/(\n\t)/g, ' ').replace(/[\n\t\r]/g, ' ');
        if (searchString == '') {
            return entry;
        }
        var color = entry.type == 'ERROR' ? '\u00A7c' : '\u00A7f';
        if (regex) {
            entry.message = entry.message.replace(new RegExp(searchString, 'g'), '\u00A7e\u00A7n$&\u00A7r' + color);
        }
        else {
            entry.message = entry.message.replace(searchString, '\u00A7e\u00A7n$&\u00A7r' + color);
        }
        return entry;
    });
    var context = c.player.UIContext;
    var thisStorage = new SettingStorage('TL-LOGGER');
    var logLimit = thisStorage.get('logLimit', 'Limit of logs', 'How many log entries can be rendered at the same time', SettingType.INTEGER, 200, {
        min: 50,
        max: 200,
    });
    var maxPages = Math.max(Math.ceil(sorted.length / logLimit), 1);
    var dataPage = Math.max(data.getInt('logPage'), 1);
    var currentPage = Math.min(maxPages, dataPage);
    data.setInt('logPage', currentPage);
    c.player.UIContext.data.setInt('logPage', currentPage);
    context.get('counter').label(currentPage + "/" + maxPages).tooltip("Sorted: " + sorted.length);
    context.get('logPage').max(Math.ceil(sorted.length / logLimit)).min(1).value(currentPage);
    var toSkip = (data.getInt('logPage') - 1) * logLimit;
    return sorted.filter(function (entry, i) {
        return i >= toSkip;
    });
}
function getLogsFromChoosedFiles(c, fileNameArray) {
    var data = c.getValue('data');
    var startDate = getDate(c, 'startDate');
    var endDate = getDate(c, 'endDate');
    var thisStorage = new SettingStorage('TL-LOGGER');
    var logsPath = thisStorage.get('path', 'Path', 'Path to store all logs files.', SettingType.STRING, 'customLogs');
    var dateFolders = Java.from(FileLib.getWorldDir().resolve(logsPath).toFile().listFiles()).filter(function (x) {
        var folderNameDate = x.getName().split('-').map(function (x) { return Number(x); });
        var folderDate = new Date(folderNameDate[0], folderNameDate[1] - 1, folderNameDate[2]);
        return folderDate >= startDate && folderDate <= endDate;
    });
    var turnedOn = fileNameArray.filter(function (file) {
        var id = "toggleList." + file;
        return data.getBoolean(id);
    });
    var finalArray = data.getBoolean("toggleList.All") ? fileNameArray : turnedOn;
    var logs = [];
    for (var _i = 0, _a = finalArray.map(function (x) {
        return x.replace('.json', '');
    }); _i < _a.length; _i++) {
        var file = _a[_i];
        for (var _b = 0, dateFolders_1 = dateFolders; _b < dateFolders_1.length; _b++) {
            var dateFolder = dateFolders_1[_b];
            var folderNameDate = dateFolder.getName().split('-').map(function (x) { return Number(x); });
            var folderDate = new Date(folderNameDate[0], folderNameDate[1] - 1, folderNameDate[2]);
            logs.push.apply(logs, Logger.getLogs(file, folderDate));
        }
    }
    return logs;
}
function getFiles() {
    var thisStorage = new SettingStorage('TL-LOGGER');
    var logsPath = thisStorage.get('path', 'Path', 'Path to store all logs files.', SettingType.STRING, 'customLogs');
    var dateFolders = Java.from(FileLib.getWorldDir().resolve(logsPath).toFile().listFiles());
    var output = [];
    for (var _i = 0, dateFolders_2 = dateFolders; _i < dateFolders_2.length; _i++) {
        var dateFolder = dateFolders_2[_i];
        var files = Java.from(new FileLib.ioFile(dateFolder).listFiles());
        for (var _a = 0, files_1 = files; _a < files_1.length; _a++) {
            var file = files_1[_a];
            if (output.indexOf(file.getName()) === -1) {
                output.push(file.getName());
            }
        }
    }
    return output.map(function (fileName) {
        return fileName.replace('.json', '');
    });
}
//endregion
//region Utils
function saveContext(player, data) {
    var nbt = data.copy();
    if (!nbt.has('dateSortAtoZ')) {
        nbt.setBoolean('dateSortAtoZ', getContext(player).getBoolean('dateSortAtoZ'));
    }
    if (!nbt.has('search.modeRegex')) {
        nbt.setBoolean('search.modeRegex', getContext(player).getBoolean('search.modeRegex'));
    }
    player.states.setString('loggerSettings', nbt.stringify());
    return nbt;
}
function getContext(player) {
    var stateId = 'loggerSettings';
    var state = player.states.getString(stateId);
    if (state == '') {
        return mappet.createCompound();
    }
    return mappet.createCompound(state);
}
function addCallback(id, callbackFunction, doUpdate) {
    if (doUpdate === void 0) { doUpdate = true; }
    TL_LoggerCallbacks[id] = {
        function: callbackFunction,
        update: doUpdate,
    };
}
function updateUI(c) {
    Task.define(function () {
        fillLogs(c);
    });
}
function getDate(c, dateId) {
    var data = c.getValue('data');
    var year = data.getInt(dateId + ".year");
    var month = data.getInt(dateId + ".month");
    var day = data.getInt(dateId + ".day");
    return new Date(year, month - 1, day);
}
//endregion
