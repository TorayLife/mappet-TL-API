let thisStorage = new SettingStorage('script');
let margin = thisStorage.init('margin', 'Margin', 'The gap between settings.', SettingType.INTEGER, 4);
let debug = thisStorage.init('debug', 'Debug', 'Used to make sure that all settings have the correct types and that everything is' +
	' correct.', SettingType.BOOLEAN, false);
/*
 * do not delete these settings, they are needed as a hint.
 * If you don't need them, comment them out.
 */
let testInteger = thisStorage.init('testInteger', 'Test Integer', 'Test integer description', SettingType.INTEGER, 4, {
	min: 4,
	max: 8,
});
let testDouble = thisStorage.init('testDouble', 'test Double', 'test Double description', SettingType.DOUBLE, 4.555);
let testBoolean = thisStorage.init('testBoolean', 'test Boolean', 'test Boolean description', SettingType.BOOLEAN, true);
let testString = thisStorage.init('testString', 'test String', 'test string description', SettingType.STRING, 'Look at my horse, my horse is amazing!');
let testRGB = thisStorage.init('testRGB', 'test RGB', 'test RGB description', SettingType.COLOR_RGB, 0xFF42AB);
let testARGB = thisStorage.init('testARGB', 'test ARGB', 'test ARGB description', SettingType.COLOR_ARGB, 0xFF55ff55);
let testColorMC = thisStorage.init('testColorMC', 'test MC', 'test MC description', SettingType.COLOR_MC, ColorMC.RED);
let testEnum = thisStorage.init('testEnum', 'test Enum', '', SettingType.ENUM, 'enum1', {enumList: ['enum1', 'enum2', 'enum3']});
let testPos = thisStorage.init('testPos', 'testPos', 'desc', SettingType.POS, [1000, 5, 1000]);

let testArray = thisStorage.init('testArray', 'test Array', 'Cool description', SettingType.ARRAY, [
	1,
	2,
	3,
], {arrayType: SettingType.INTEGER});
let testArrayColorRGB = thisStorage.init('testArrayColorRGB', 'test Array color RGB', 'Cool description', SettingType.ARRAY, [0xFF42AB], {arrayType: SettingType.COLOR_RGB});
let testArrayColorARGB = thisStorage.init('testArrayColorARGB', 'test Array color ARGB', 'Cool description', SettingType.ARRAY, [0xFF0042AB], {arrayType: SettingType.COLOR_ARGB});
let testArrayColorMC = thisStorage.init('testArrayColorMC', 'test Array color MC', 'Cool description', SettingType.ARRAY, [ColorMC.RED], {arrayType: SettingType.COLOR_MC});
let testArrayEnum = thisStorage.init('testArrayEnum', 'test Array Enum', 'Cool description', SettingType.ARRAY, ['variant 1'], {
	arrayType: SettingType.ENUM,
	enumList: ['variant 1', 'variant 2', 'variant 3'],
});
let testArrayPos = thisStorage.init('testArrayPos', 'test Array Pos', 'Cool description', SettingType.ARRAY, [
	[2, 5, 6],
	[3, 3, 3],
], {arrayType: SettingType.POS});