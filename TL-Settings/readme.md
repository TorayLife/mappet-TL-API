# TL-Settings

### Current version: 0.0.3

### Description:

Advanced way to tweak your scripts without actually edit them.

### Dependencies:
* [TL-Tasks](https://github.com/TorayLife/mappet-TL-API/tree/master/TL-Tasks)
* [TL-FileLib](https://github.com/TorayLife/mappet-TL-API/tree/master/TL-FileLib)

### Install:

1) Create `TL-Settings` script on mappet dashboard.
2) Add `TL-FileLib` scripts as a libraries.
3) [Copy this code](https://raw.githubusercontent.com/TorayLife/mappet-TL-API/master/TL-Settings/TL-Settings.js) to your `TL-Settings` script.
4) Create `TL-SettingsEditor` script on mappet dashboard.
5) Add `TL-Tasks`, `TL-FileLib` and `TL-Settings` scripts as a libraries.
6) [Copy this code](https://raw.githubusercontent.com/TorayLife/mappet-TL-API/master/TL-Settings/TL-SettingsEditor.js) to your `TL-SettingsEditor` script.
7) Turn ON `unique` option.
8) Done!

### How to use:

Here is pretty simple video about how to use this library.

[![TL-Settings usage example](https://img.youtube.com/vi/sI45mE0urvM/0.jpg)](https://youtu.be/sI45mE0urvM)

example code:

```js
function main(c) {
    // Code...
    var s = c.getSubject();

    var thisStorage = new SettingStorage(c.script);
    var message = thisStorage.init('systemId', 'Actual name', 'Description that defines your setting wery well.', SettingType.STRING, 'defaultValue');
    // You can also use this if setting is already initialized:
    var message1 = thisStorage.get('systemId');
    s.send(message);
    s.send(message1);


}
```

### Syntax:

> ### `new SettingStorage(String settingFileName)`
> 
> ---
> - **settingFileName** - Name of settingStorage file.



> ### `<SettingStorage>.init(String systemId, String name, String description, SettingType type, <T> defaultValue, Object additionalData(optional))`
>
> ---
> - **systemId** - Unique id for this setting storage.
>
> - **name** - Name that displays in SettingsEditor.
>
> - **description** - Description that displays in tooltip in SettingsEditor.
>
> - **type** - Type of setting. see [Types](https://github.com/TorayLife/mappet-TL-API/tree/master/TL-Settings#Types).
>
> - **defaultValue** - Value that uses if there is no settings file.
>
> - **additionalData** - Additional data for some rare tweaks.

> ### `<SettingStorage>.get(String systemId)`
>
> ---
> - **systemId** - Unique id for this setting storage.

### Types:

* BOOLEAN
* INTEGER
  * additionalData: min - minimum value
  * additionalData: max - maximum value
* DOUBLE
  * additionalData: min - minimum value
  * additionalData: max - maximum value
* STRING
* COLOR_RGB
* COLOR_ARGB
* COLOR_MC
* ENUM
* POS
* ARRAY
  * additionalData: arrayType - type of array elements. e.g. `SettingType.POS` 
* PARAGRAPH

### Avaible settings:
Global:

* Settings path - path to folder when you want to store your settings.
`settings/1` equals to `saves/<world_folder>/settings/1`

TL-SettingsEditor:
* Margin - The gap between settings.