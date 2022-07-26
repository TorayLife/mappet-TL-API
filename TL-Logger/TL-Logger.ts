/*! TL-Logger
 * Version: 0.0.1
 * https://github.com/TorayLife/mappet-TL-API/tree/master/TL-Logger
 * Made by TorayLife (https://github.com/TorayLife)
 */

//region Library code

//TL-LOGGER
abstract class Logger {
	private static getLogsPath() {
		let storage = new SettingStorage('TL-LOGGER');
		return storage.get('path', 'Path', 'Path to store all logs files.', SettingType.STRING, 'customLogs');
	}

	static getUTC() {
		let storage = new SettingStorage('TL-LOGGER');
		return storage.get('utc', 'UTC offset', 'Your local time zone. for example, GMT+3 will be equal to 3.', SettingType.INTEGER, 0);
	}

	static info(c: IScriptEvent, message: string | error) {
		this.log(c, message, 'INFO');
	}

	static debug(c: IScriptEvent, message: string | error) {
		this.log(c, message, 'DEBUG');
	}

	static error(c: IScriptEvent, message: string | error) {
		this.log(c, message, 'ERROR');
	}

	static log(c: IScriptEvent, message: string | error, type: 'INFO' | 'DEBUG' | 'ERROR') {
		let storage = new SettingStorage('TL-LOGGER');
		let sendList = storage.get('receiverList', 'Receiver list', 'If true, will send log to any player in array above.', SettingType.ARRAY, ['Sir_Toray_Life'], {
			arrayType: SettingType.STRING,
		});
		let isSend = storage.get('sendToReceiverList', 'Send to Receivers', 'If true, will send log to any player in receiver list', SettingType.BOOLEAN, false);
		let date = new Date();
		date.setTime(date.getTime());
		let path = `${this.getLogsPath()}/${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

		if (!FileLib.has(path, `${c.script}.json`)) {
			FileLib.create(path, `${c.script}.json`);

			let file = FileLib.get(path, `${c.script}.json`);
			FileLib.write(file, []);
		}
		let file = FileLib.get(path, `${c.script}.json`);
		let fileData = FileLib.read(file);
		let log = new logEntry(type, c, message);

		if (isSend) {
			let allPlayers = Java.from(c.server.allPlayers);
			allPlayers.forEach((player) => {
				if (sendList.indexOf(player.name) !== -1) {
					player.send(log.toString());
				}
			});
		}


		fileData.push(log.getData());
		FileLib.write(file, fileData);
	}

	static getLogs(fileName: string, date: Date) {
		let path = `${this.getLogsPath()}/${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

		if (!FileLib.has(path, `${fileName}.json`)) {
			FileLib.create(path, `${fileName}.json`);

			let file = FileLib.get(path, `${fileName}.json`);
			FileLib.write(file, []);
		}
		let file = FileLib.get(path, `${fileName}.json`);
		let fileData = FileLib.read(file);
		return fileData.map((entry) => {
			return entry;
		});
	}
}

type error = {
	stack: string;
};


class logEntry {
	private data: any;

	constructor(type: string, c: IScriptEvent | null, message: string | error) {
		let date = new Date();
		date.setTime(date.getTime() + Logger.getUTC() * 60 * 60 * 1000);

		let s = c?.subject ?? null;
		let subject;
		if (s) {
			subject = {
				name: s.name,
				uuid: s.uniqueId,
				x: s.position.x,
				y: s.position.y,
				z: s.position.z,
			};
		}

		let o = c?.object ?? null;
		let object;
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
			script: c?.script ?? 'unknown',
			function: c?.function ?? 'unknown',
			subject: subject,
			object: object,
			type: type,
			message: (<error>message).stack ? (<error>message).stack : message,
		};
	}

	static getFromJS(js: object, c) {
		let log = new logEntry('', c, '');
		log.data = js;
		return log;
	}

	getData() {
		return this.data;
	}

	toString() {
		let date = `${new Date(this.data.date).toISOString().replace('T', ' ').slice(0, -5)}`;

		let logType = '';
		if (this.data.type == 'INFO') {
			logType = '\u00A72INFO';
		}
		if (this.data.type == 'DEBUG') {
			logType = '\u00A79DEBUG';
		}
		if (this.data.type == 'ERROR') {
			logType = '\u00A74ERROR';
		}
		let logText =
			`\u00A77\\[${date}\u00A77]` +
			`\\[${this.data.script}: ${this.data.function}]` +
			`\\[${logType}\u00A77]: \u00A7f${(this.data.type == 'ERROR' ? '\u00A7c' : '') + this.data.message}`;
		return logText;
	}
}


let TL_LoggerCallbacks = {};

//endregion

//region Mappet functions

// @ts-ignore
function main(c: IScriptEvent) {
	try {
		Task
			.define(() => {
				Logger.info(c, `${c.player.name} open a Logger!`);
				createUI(c);
			})
			.then(() => {
				fillLogs(c);
			});
	}
	catch (e) {
		Logger.error(c, e);
	}
}

function TL_LoggerHandler(c: IScriptEvent) {
	try {
		let context = c.player.UIContext;
		let last = context.last;
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

function createUI(c: IScriptEvent, show: boolean = true) {
	try {
		let thisStorage = new SettingStorage('TL-LOGGER');
		let debug = thisStorage.get('debug', 'Debug', 'Print debug logs when open UI.', SettingType.BOOLEAN, false);

		if (debug) {
			Logger.debug(c, 'Logger must work!');
			Logger.debug(c, 'This is a very very long debug log! This is a very very long debug log! This is a very very long debug log!' +
				' This is a very very long debug log! This is a very very long debug log! This is a very very long debug log! This is a very' +
				' very long debug log! This is a very very long debug log! This is a very very long debug log! This is a very very long' +
				' debug log! This is a very very long debug log! This is a very very long debug log! This is a very very long debug log!');
		}

		c.setValue('data', getContext(c.player));
		let root = mappet.createUI(c, 'TL_LoggerHandler').background();
		let baseUI = formBaseUI(root, c);

		let logOptionsUI = formLogOptionsUI(root, c);

		if (show) {
			c.player.openUI(root, true);
		}
	}
	catch (e) {
		Logger.error(c, e);
	}
}

function formBaseUI(root, c) {
	let baseLayout = root.layout();
	baseLayout.current.rwh(1, 1).id('baseLayout');
	//baseLayout.current.keybind(63, 'F5', 'F5');
	formFileToggles(baseLayout, c);
	formTypeToggles(baseLayout, c);
	let layout = baseLayout.layout();
	layout.current.rx(0.2, 20).rwh(0.75, 1);
	formEmptyLogs(layout, c);
	formAbove(layout, c);
	formUnder(layout);
	return baseLayout;
}

function formLogOptionsUI(root, c) {
	let logOptionsLayout = root.layout();
	logOptionsLayout.current.rwh(1, 1).id('logOptionsLayout').enabled(false).visible(false).tooltip('\u00A70.');

	//background shading

	let graphic = logOptionsLayout.graphics();
	graphic.rwh(1, 1).rxy(0, 0);
	graphic.rect(-100, -100, 8000, 8000, 0xcc000000);

	//options

	let column = logOptionsLayout.column(4, 10);
	column.current.rwh(0.8, 0.8).rxy(0.5, 0.5).anchor(0.5, 0.5);

	let entitesRow = column.row(4, 10);
	entitesRow.current.rh(0.5);
	let subjectCol = entitesRow.column(4);
	subjectCol.label('==SUBJECT==').h(20).labelAnchor(0.5, 0.5);
	subjectCol.label('==').id('options.subject.status').h(20).labelAnchor(0.5, 0.5);
	subjectCol.label('Name:').h(20).labelAnchor(0, 0.5);
	subjectCol.textbox('').h(20).id('options.subject.name').maxLength(100);
	subjectCol.label('UUID:').h(20).labelAnchor(0, 0.5);
	subjectCol.textbox('').h(20).id('options.subject.uuid').maxLength(100);
	subjectCol.label('Coords:').h(20).labelAnchor(0, 0.5);
	subjectCol.textbox('').h(20).id('options.subject.pos').maxLength(100);
	subjectCol.button('TP to ').h(20).id('options.subject.tp');

	let objectRow = entitesRow.column(4);
	objectRow.label('==OBJECT==').h(20).labelAnchor(0.5, 0.5);
	objectRow.label('==').id('options.object.status').h(20).labelAnchor(0.5, 0.5);
	objectRow.label('Name:').h(20).labelAnchor(0, 0.5);
	objectRow.textbox('').h(20).id('options.object.name').maxLength(100);
	objectRow.label('UUID:').h(20).labelAnchor(0, 0.5);
	objectRow.textbox('').h(20).id('options.object.uuid').maxLength(100);
	objectRow.label('Coords:').h(20).labelAnchor(0, 0.5);
	objectRow.textbox('').h(20).id('options.object.pos').maxLength(100);
	objectRow.button('TP to ').h(20).id('options.object.tp');

	let returnRow = column.row(4, 40);
	returnRow.button('return').wh(120, 20).id('logOptionsLayout.return');
	addCallback('logOptionsLayout.return', (c, elementId) => {
		let context = c.player.UIContext;
		context.get('baseLayout').enabled(true);
		context.get('logOptionsLayout').enabled(false).visible(false);
	}, false);
}

function formEmptyLogs(root, c) {
	try {
		let thisStorage = new SettingStorage('TL-LOGGER');
		let logLimit = thisStorage.get('logLimit', 'Limit of logs', 'How many log entries can be rendered at the same time', SettingType.INTEGER, 200, {
			min: 50,
			max: 200,
		});
		let logList = root.column(0, 5);
		logList.current.ry(0.06).rwh(1, 0.88).scroll();
		for (let i = 0; i < logLimit; i++) {
			let row = logList.layout();
			row.current.h(0).visible(false).margin(0).id(`log.layout.${i}`).rw(1);
			let text = row.text('');
			text.h(0).visible(false).margin(0).id(`log.label.${i}`).rw(1);
			row.current.context('download', `log.more.${i}`, 'More...', 0x474389);
			addCallback(`log.more.${i}`, (c, elementId) => {
				let context = c.player.UIContext;
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
		let above = root.layout();
		above.current.rwh(1, 0.06).ry(0, 10);
		let data = getContext(c.player);
		let fromAtoZ = data.getBoolean('dateSortAtoZ');

		above.label(!fromAtoZ ? 'Date: from A to Z' : 'Date: from Z to A').id('dateSort').h(16).w(150).background(0x66000000).labelAnchor(0, 0.5);
		above.icon(fromAtoZ ? 'move_down' : 'move_up').id('dateSort.icon').wh(16, 16).x(90);
		addCallback('dateSort.icon', (c, elementId) => {
			let data = getContext(c.player);
			let sortAtoZ = !data.getBoolean('dateSortAtoZ');
			data.setBoolean('dateSortAtoZ', sortAtoZ);
			saveContext(c.player, data);

			c.player.UIContext.get('dateSort').label(!sortAtoZ ? 'Date: from A to Z' : 'Date: from Z to A');
			c.player.UIContext.get('dateSort.icon').icon(sortAtoZ ? 'move_down' : 'move_up');
		});


		let searchRegex = data.getBoolean('search.modeRegex');

		above.toggle('Search in names:').state(data.getBoolean('search.names')).id('search.names').wh(125, 16).anchorX(1).rx(1, -370);
		above.label('Search:').labelAnchor(0, 0.5).wh(65, 16).anchorX(1).rx(1, -300);
		above.textbox(data.getString('searchbar')).wh(300, 16).id('searchbar').rx(1, -20).anchorX(1).updateDelay(500).tooltip(searchRegex ? 'Using' +
			' regex to search' : 'Normal search').color(searchRegex ? 0x99ff99 : 0xffffff);

		above.icon(searchRegex ? 'graph' : 'bubble').id('search.mode').wh(16, 16).rx(1).anchorX(1).tooltip(searchRegex ? 'Using regex to' +
			' search' : 'Normal search');

		addCallback('search.mode', (c, elementId) => {
			let data = getContext(c.player);
			let searchRegex = !data.getBoolean('search.modeRegex');
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
	let under = root.layout();
	under.current.rwh(1, 0.06).rxy(0, 1).anchor(0, 1);

	under.button('Form log list').h(20).rw(0.8).id('form').background(0x474389);
	under.label('').rxy(1, 0).labelAnchor(1, 0.5).anchor(1, 0).rw(0.2).h(20).id('counter');
	under.trackpad().integer().id('logPage').rx(0.8, 4).ry(0).wh(60, 20).tooltip('Page of' +
		' logger').min(1).updateDelay(1000);
}

function formFileToggles(root, c) {

	let data = c.getValue('data');

	let fileList = getFiles();
	let fileTogglesLayout = root.layout();
	fileTogglesLayout.current.rwh(0.2, 0.5).rx(0, 10).ry(0, 0);
	let fileTogglesList = fileTogglesLayout.column(4);
	fileTogglesList.current.rwh(1, 1).scroll().scrollSize(0.05);

	let elem = fileTogglesList.toggle(`All`).h(20).id(`toggleList.All`);
	elem.state(data ? data.getBoolean(`toggleList.All`) : true);

	addCallback(`toggleList.All`, (c, elementId) => {
		let togglesList = fileList.map((file) => {
			return `toggleList.${file.replace('.json', '')}`;
		});
		let context = c.player.UIContext;
		for (let toggle of togglesList) {
			context.get(toggle).enabled(!context.data.getBoolean(elementId));
		}
	});

	for (let fileName of fileList) {
		let file = fileName.replace('.json', '');
		let elem = fileTogglesList.toggle(file).h(20).id(`toggleList.${file}`);
		elem.state(data ? data.getBoolean(`toggleList.${file}`) : false).enabled(data ? !data.getBoolean('toggleList.All') : false);
	}
}

function formTypeToggles(root, c) {
	let data = c.getValue('data');
	let rememberPeriod = data ? data.getBoolean('period') : false;
	let typeTogglesLayout = root.layout();
	typeTogglesLayout.current.rwh(0.2, 0.5).rx(0, 10).ry(1, -10).anchor(0, 1);
	let typeTogglesList = typeTogglesLayout.column(4);
	typeTogglesList.current.rwh(1, 1).anchor(0, 1).rxy(0, 1);
	typeTogglesList.label('Types:').h(10);
	typeTogglesList.toggle('[2INFO').id('typeList.info').h(20).state(data ? data.getBoolean('typeList.info') : true);
	typeTogglesList.toggle('[9DEBUG').id('typeList.debug').h(20).state(data ? data.getBoolean('typeList.debug') : true);
	typeTogglesList.toggle('[4ERROR').id('typeList.error').h(20).state(data ? data.getBoolean('typeList.error') : true);

	let startDate = new Date(0);
	if (data && rememberPeriod) {
		startDate = new Date(data.getInt('startDate.year'), data.getInt('startDate.month') - 1, data.getInt('startDate.day'),
			data.getInt('startDate.hour') + Logger.getUTC(), data.getInt('startDate.minutes'), data.getInt('startDate.seconds'));
	}
	dateElement(typeTogglesList, 'Period start:', 'startDate', startDate);

	let endDate = new Date();
	endDate.setTime(endDate.setUTCHours(23,59,59,999));
	if (data && rememberPeriod) {
		endDate = new Date(data.getInt('endDate.year'), data.getInt('endDate.month') - 1, data.getInt('endDate.day'),
			data.getInt('endDate.hour') + Logger.getUTC(), data.getInt('endDate.minutes'), data.getInt('endDate.seconds'));
	}

	dateElement(typeTogglesList, 'Period end:', 'endDate', endDate);
	typeTogglesList.toggle('Remember period').id('period').state(data ? data.getBoolean('period') : false).h(20);
	typeTogglesList.label('\u00A7cWait...').id('status').labelAnchor(0.5).h(20).background(0xcc000000);
}

function dateElement(root: IMappetUIBuilder, label: string, dateId: string, defaultDate: Date) {
	let column = root.column(2);
	column.current.context('file', `${dateId}.now`, 'Now', 0x474389);
	column.current.context('leftload', `${dateId}.dayStart`, 'Day start', 0x474389);
	column.current.context('rightload', `${dateId}.dayEnd`, 'Day end', 0x474389);
	addCallback(`${dateId}.now`, (c, elementId) => {
		let context = c.player.UIContext;
		let date = new Date();
		let day = date.getUTCDate();
		let month = date.getUTCMonth() + 1;
		let year = date.getUTCFullYear();
		let hour = date.getUTCHours() + Logger.getUTC();
		let minutes = date.getUTCMinutes();
		let seconds = date.getUTCSeconds();


		let dateId = elementId.split('.')[0];
		context.get(`${dateId}.day`).value(day);
		context.get(`${dateId}.month`).value(month);
		context.get(`${dateId}.year`).value(year);
		context.get(`${dateId}.hour`).value(hour);
		context.get(`${dateId}.minutes`).value(minutes);
		context.get(`${dateId}.seconds`).value(seconds);
		context.data.setInt(`${dateId}.day`, day);
		context.data.setInt(`${dateId}.month`, month);
		context.data.setInt(`${dateId}.year`, year);
		context.data.setInt(`${dateId}.hour`, hour);
		context.data.setInt(`${dateId}.minutes`, minutes);
		context.data.setInt(`${dateId}.seconds`, seconds);
	});
	addCallback(`${dateId}.dayStart`, (c, elementId) => {
		let context = c.player.UIContext;
		context.get(`${dateId}.hour`).value(0);
		context.get(`${dateId}.minutes`).value(0);
		context.get(`${dateId}.seconds`).value(0);
		context.data.setInt(`${dateId}.hour`, 0);
		context.data.setInt(`${dateId}.minutes`, 0);
		context.data.setInt(`${dateId}.seconds`, 0);
	});
	addCallback(`${dateId}.dayEnd`, (c, elementId) => {
		let context = c.player.UIContext;
		context.get(`${dateId}.hour`).value(23);
		context.get(`${dateId}.minutes`).value(59);
		context.get(`${dateId}.seconds`).value(59);
		context.data.setInt(`${dateId}.hour`, 23);
		context.data.setInt(`${dateId}.minutes`, 59);
		context.data.setInt(`${dateId}.seconds`, 59);
	});

	column.label(label).h(10).marginTop(4);

	let row = column.row(2);

	row.trackpad().limit(1, 31).integer().h(15).value(defaultDate.getUTCDate()).id(`${dateId}.day`).updateDelay(800);
	row.trackpad().limit(1, 12).integer().h(15).value(defaultDate.getUTCMonth() + 1).id(`${dateId}.month`).updateDelay(800);
	row.trackpad().limit(1970, 4200).integer().h(15).value(defaultDate.getUTCFullYear()).id(`${dateId}.year`).updateDelay(800);

	let row2 = column.row(2);

	row2.trackpad().limit(0, 23).integer().h(15).value(defaultDate.getUTCHours()).id(`${dateId}.hour`).updateDelay(800);
	row2.trackpad().limit(0, 59).integer().h(15).value(defaultDate.getUTCMinutes()).id(`${dateId}.minutes`).updateDelay(800);
	row2.trackpad().limit(0, 59).integer().h(15).value(defaultDate.getUTCSeconds()).id(`${dateId}.seconds`).updateDelay(800);
}

//endregion

//region Work with logs

function clearLogs(c: IScriptEvent, limit) {
	try {
		let context = c.player.UIContext;

		for (let i = 0; i < limit; i++) {
			context.get(`log.layout.${i}`).h(0).visible(false).margin(0);
			context.get(`log.label.${i}`).h(0).visible(false).margin(0);
		}
	}
	catch (e) {
		Logger.error(c, e);
	}
}

function fillLogs(c: IScriptEvent) {
	try {
		let context = c.player.UIContext;

		context.get('status').label('\u00A7cWait...');
		context.sendToPlayer();


		saveContext(c.player, context.data);

		c.setValue('data', getContext(c.player));

		let thisStorage = new SettingStorage('TL-LOGGER');
		let logLimit = thisStorage.get('logLimit', 'Limit of logs', 'How many log entries can be rendered at the same time', SettingType.INTEGER, 200, {
			min: 50,
			max: 200,
		});

		clearLogs(c, logLimit);

		let logs = getLogsWithSelections(c);
		for (let i in logs) {
			let log = logs[i];
			if (i >= logLimit) {
				break;
			}
			let layout = context.get(`log.layout.${i}`);
			let text = context.get(`log.label.${i}`);
			text.h(20).visible(true).margin(4);
			let logText = logEntry.getFromJS(log, c).toString();
			let tooltip = `[7Subject:\n`;
			let s = log.subject;
			let o = log.object;
			if (s) {
				tooltip += `[7Name:\n  [e${s.name}\n`;
				tooltip += `[7At:\n  [e${s.x?.toFixed(3)} ${s.y?.toFixed(3)} ${s.z?.toFixed(3)}\n`;
			}
			else {
				tooltip += 'null';
			}
			tooltip += '[7============\nObject:\n';
			if (o) {
				tooltip += `[7Name:\n  [e${o.name}\n`;
				tooltip += `[7At:\n  [e${o.x?.toFixed(3)} ${o.y?.toFixed(3)} ${o.z?.toFixed(3)}\n`;
			}
			else {
				tooltip += 'null';
			}
			text.label(logText);
			text.tooltip(tooltip);
			let textWithoutColor = logText.replace(new RegExp('\u00A7.', 'g'), '');

			let height = (textWithoutColor.length / 140) > 1 ? 20 + 11 * (Math.round(textWithoutColor.length / 140)) : 20;
			layout.h(height).visible(true).margin(4);

			addCallback(`log.more.${i}`, (c, elementId) => {
				let context = c.player.UIContext;
				context.get('baseLayout').enabled(false);
				context.get('logOptionsLayout').enabled(true).visible(true);


				let subjectEntity;
				let subjectName;
				let subjectUUID;
				let subjectPos;
				if (s) {

					subjectEntity = c.server?.getEntity(s.uuid);
					subjectName = s.name;
					subjectUUID = s.uuid;
					subjectPos = `${s.x.toFixed(3)} ${s.y.toFixed(3)} ${s.z.toFixed(3)}`;
				}
				let color = subjectEntity ? `\u00A7a` : `\u00A7c`;
				let online = subjectEntity ? `Online` : `Offline`;
				let type = subjectEntity?.isPlayer() ? 'Player' : 'Entity';
				let status = `${color}Status: ${online}(${type})`;
				context.get('options.subject.status').label(status);

				context.get('options.subject.name').label(subjectName ?? '');
				context.get('options.subject.uuid').label(subjectUUID ?? '');
				context.get('options.subject.pos').label(subjectPos ?? '');
				context.get('options.subject.tp').label(`TP to: ${subjectName}`).enabled(s);

				let objectEntity;
				let objectName;
				let objectUUID;
				let objectPos;
				if (o) {

					objectEntity = c.server?.getEntity(o.uuid);
					objectName = o.name;
					objectUUID = o.uuid;
					objectPos = `${o.x.toFixed(3)} ${o.y.toFixed(3)} ${o.z.toFixed(3)}`;
				}
				color = objectEntity ? `\u00A7a` : `\u00A7c`;
				online = objectEntity ? `Online` : `Offline`;
				type = objectEntity?.isPlayer() ? 'Player' : 'Entity';
				status = `${color}Status: ${online}(${type})`;
				context.get('options.object.status').label(status);


				context.get('options.object.name').label(objectName ?? '');
				context.get('options.object.uuid').label(objectUUID ?? '');
				context.get('options.object.pos').label(objectPos ?? '');
				context.get('options.object.tp').label(`TP to: ${objectName}`).enabled(o);

				addCallback('options.subject.tp', (c, elementId) => {
					let x = s.x;
					let y = s.y;
					let z = s.z;


					if (x == undefined || y == undefined || z == undefined || c.server.getEntity(s.uuid) == undefined) {
						c.player.UIContext.get('options.subject.tp').label(`\u00A7cCan't tp to this entity...`);
						c.player.UIContext.sendToPlayer();
						Task.define(() => {
							c.player.UIContext.get('options.subject.tp').label(`TP to: ${s.name}`);
							c.player.UIContext.sendToPlayer();
						}, 2000);
					}
					c.player.setPosition(x, y, z);
					c.player.UIContext.get('options.subject.tp').label(`\u00A7aTeleported`);
					c.player.UIContext.sendToPlayer();
					Task.define(() => {
						c.player.UIContext.get('options.subject.tp').label(`TP to: ${s.name}`);
						c.player.UIContext.sendToPlayer();
					}, 2000);
				}, false);

				addCallback('options.object.tp', (c, elementId) => {
					let x = o.x;
					let y = o.y;
					let z = o.z;


					if (x == undefined || y == undefined || z == undefined || c.server.getEntity(o.uuid) == undefined) {
						c.player.UIContext.get('options.object.tp').label(`\u00A7cCan't tp to this entity...`);
						c.player.UIContext.sendToPlayer();
						Task.define(() => {
							c.player.UIContext.get('options.object.tp').label(`TP to: ${o.name}`);
							c.player.UIContext.sendToPlayer();
						}, 2000);
					}
					else {
						c.player.setPosition(x, y, z);
						c.player.UIContext.get('options.object.tp').label(`\u00A7aTeleported`);
						c.player.UIContext.sendToPlayer();
						Task.define(() => {
							c.player.UIContext.get('options.object.tp').label(`TP to: ${o.name}`);
							c.player.UIContext.sendToPlayer();
						}, 2000);
					}
				}, false);


			}, false);
		}
		context.get('status').label('\u00A7aLogs loaded!');
		context.sendToPlayer();
	}
	catch (e) {
		Logger.error(c, e);
	}
}

function getLogsWithSelections(c: IScriptEvent) {
	let data = c.getValue('data');
	let fileList = getFiles();
	let filteredByFiles = getLogsFromChoosedFiles(c, fileList);
	let dataInfo = data.getBoolean('typeList.info');
	let dataDebug = data.getBoolean('typeList.debug');
	let dataError = data.getBoolean('typeList.error');

	let startDate = getDate(c, 'startDate');
	startDate.setTime(startDate.getTime() + (data.getInt('startDate.hour') + Logger.getUTC()) * 60 * 60 * 1000);
	startDate.setTime(startDate.getTime() + data.getInt('startDate.minutes') * 60 * 1000);
	startDate.setTime(startDate.getTime() + data.getInt('startDate.seconds') * 1000);
	let startTime = startDate.getTime();

	let endDate = getDate(c, 'endDate');
	endDate.setTime(endDate.getTime() + (data.getInt('endDate.hour') + Logger.getUTC()) * 60 * 60 * 1000);
	endDate.setTime(endDate.getTime() + data.getInt('endDate.minutes') * 60 * 1000);
	endDate.setTime(endDate.getTime() + data.getInt('endDate.seconds') * 1000);
	let endTime = endDate.getTime();

	let sortFromAtoZ = data.getBoolean('dateSortAtoZ');

	let filtered = filteredByFiles.filter((entry) => {
		let info = entry.type == 'INFO' && dataInfo;
		let debug = entry.type == 'DEBUG' && dataDebug;
		let error = entry.type == 'ERROR' && dataError;

		let byType = info || debug || error;

		let byTime = startTime <= entry.date && endTime >= entry.date;

		return byType && byTime;
	});
	let sorted = filtered.sort((a, b) => {
		if (sortFromAtoZ) {
			return b.date - a.date;
		}
		else {
			return a.date - b.date;
		}
	}).filter((entry) => {
		let message = entry.message;

		if (data.getBoolean('search.names')) {
			message = message.concat('↨', entry.subject?.name).concat('↨', entry.object?.name);
		}

		if (data.getBoolean('search.modeRegex')) {
			return message.match(new RegExp(data.getString('searchbar'))) != null;
		}
		else {
			return message.indexOf(data.getString('searchbar')) !== -1;
		}
	}).map((entry) => {
		let regex = data.getBoolean('search.modeRegex');
		let searchString = data.getString('searchbar');

		entry.message = entry.message.replace(/(\n\t)/g, ' ').replace(/[\n\t\r]/g, ' ');

		if (searchString == '') {
			return entry;
		}
		let color = entry.type == 'ERROR' ? '\u00A7c' : '\u00A7f';

		if (regex) {
			entry.message = entry.message.replace(new RegExp(searchString, 'g'), '\u00A7e\u00A7n$&\u00A7r' + color);
		}
		else {
			entry.message = entry.message.replace(searchString, '\u00A7e\u00A7n$&\u00A7r' + color);
		}
		return entry;
	});

	let context = c.player.UIContext;

	let thisStorage = new SettingStorage('TL-LOGGER');
	let logLimit = thisStorage.get('logLimit', 'Limit of logs', 'How many log entries can be rendered at the same time', SettingType.INTEGER, 200, {
		min: 50,
		max: 200,
	});

	let maxPages = Math.max(Math.ceil(sorted.length / logLimit), 1);
	let dataPage = Math.max(data.getInt('logPage'), 1);
	let currentPage = Math.min(maxPages, dataPage);
	data.setInt('logPage', currentPage);
	c.player.UIContext.data.setInt('logPage', currentPage);

	context.get('counter').label(`${currentPage}/${maxPages}`).tooltip(`Sorted: ${sorted.length}`);
	context.get('logPage').max(Math.ceil(sorted.length / logLimit)).min(1).value(currentPage);

	let toSkip = (data.getInt('logPage') - 1) * logLimit;

	return sorted.filter((entry, i) => {
		return i >= toSkip;
	});
}

function getLogsFromChoosedFiles(c: IScriptEvent, fileNameArray: string[]) {
	let data = c.getValue('data');
	let startDate = getDate(c, 'startDate');
	let endDate = getDate(c, 'endDate');
	let thisStorage = new SettingStorage('TL-LOGGER');
	let logsPath = thisStorage.get('path', 'Path', 'Path to store all logs files.', SettingType.STRING, 'customLogs');

	let dateFolders: any[] = Java.from(FileLib.getWorldDir().resolve(logsPath).toFile().listFiles()).filter((x: any) => {
		let folderNameDate = x.getName().split('-').map(x => Number(x));
		let folderDate = new Date(folderNameDate[0], folderNameDate[1] - 1, folderNameDate[2]);
		return folderDate >= startDate && folderDate <= endDate;
	});


	let turnedOn = fileNameArray.filter((file) => {
		let id = `toggleList.${file}`;
		return data.getBoolean(id);
	});
	let finalArray = data.getBoolean(`toggleList.All`) ? fileNameArray : turnedOn;
	let logs: any[] = [];
	for (let file of finalArray.map((x) => {
		return x.replace('.json', '');
	})) {
		for (let dateFolder of dateFolders) {
			let folderNameDate = dateFolder.getName().split('-').map(x => Number(x));
			let folderDate = new Date(folderNameDate[0], folderNameDate[1] - 1, folderNameDate[2]);
			logs.push(...Logger.getLogs(file, folderDate));
		}
	}
	return logs;
}

function getFiles() {
	let thisStorage = new SettingStorage('TL-LOGGER');
	let logsPath = thisStorage.get('path', 'Path', 'Path to store all logs files.', SettingType.STRING, 'customLogs');

	let dateFolders = Java.from(FileLib.getWorldDir().resolve(logsPath).toFile().listFiles());
	let output: string[] = [];
	for (let dateFolder of dateFolders) {
		let files: any[] = Java.from(new FileLib.ioFile(dateFolder).listFiles());
		for (let file of files) {
			if (output.indexOf(file.getName()) === -1) {
				output.push(file.getName());
			}
		}
	}
	return output.map((fileName) => {
		return fileName.replace('.json', '');
	});
}

//endregion

//region Utils

function saveContext(player: IScriptPlayer, data: INBTCompound) {
	let nbt = <INBTCompound>data.copy();
	if (!nbt.has('dateSortAtoZ')) {
		nbt.setBoolean('dateSortAtoZ', getContext(player).getBoolean('dateSortAtoZ'));
	}
	if (!(<INBTCompound>nbt).has('search.modeRegex')) {
		nbt.setBoolean('search.modeRegex', getContext(player).getBoolean('search.modeRegex'));
	}
	player.states.setString('loggerSettings', nbt.stringify());
	return nbt;
}

function getContext(player: IScriptPlayer) {
	let stateId = 'loggerSettings';
	let state = player.states.getString(stateId);
	if (state == '') {
		return mappet.createCompound();
	}
	return mappet.createCompound(state);
}

function addCallback(id: string, callbackFunction: (c: IScriptEvent, elementId: string) => any, doUpdate: boolean = true) {
	TL_LoggerCallbacks[id] = {
		function: callbackFunction,
		update: doUpdate,
	};
}

function updateUI(c) {
	Task.define(() => {
		fillLogs(c);
	});
}

function getDate(c: IScriptEvent, dateId: string) {
	let data = c.getValue('data');
	let year = data.getInt(`${dateId}.year`);
	let month = data.getInt(`${dateId}.month`);
	let day = data.getInt(`${dateId}.day`);
	return new Date(year, month - 1, day);
}

//endregion