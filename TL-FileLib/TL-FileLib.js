var FileLib = /** @class */ (function () {
    function FileLib() {
    }
    FileLib.getPath = function (str) {
        return (typeof str == 'object') ? str.join('/') : str;
    };
    FileLib.create = function (path, fileName) {
        var worldDir = this.getWorldDir();
        var dir = (typeof path == 'object') ? worldDir.resolve(path.join('/')) : worldDir.resolve(path);
        if (!FileLib.nioFiles.exists(dir)) {
            FileLib.nioFiles.createDirectories(dir);
        }
        var file = dir.resolve(fileName);
        if (!FileLib.nioFiles.exists(file)) {
            return FileLib.nioFiles.createFile(file);
        }
        throw "File " + path + "/" + fileName + " already exists!";
    };
    FileLib.rename = function (file, newName) {
        var dir = file.getParent();
        var newFile = dir.resolve(newName);
        file.toFile().renameTo(newFile.toFile());
        return newFile;
    };
    FileLib.delete = function (file) {
        if (FileLib.nioFiles.exists(file)) {
            file.toFile().delete();
            return;
        }
        throw "File " + file + " does not exists!";
    };
    FileLib.get = function (path, fileName) {
        var worldDir = this.getWorldDir();
        var dir = worldDir.resolve(this.getPath(path));
        var file = dir.resolve(fileName);
        if (FileLib.nioFiles.exists(file)) {
            return file;
        }
        throw "File " + path + "/" + fileName + " does not exists!";
    };
    FileLib.has = function (path, fileName) {
        var worldDir = this.getWorldDir();
        var dir = worldDir.resolve(this.getPath(path));
        var file = dir.resolve(fileName);
        if (FileLib.nioFiles.exists(file)) {
            return true;
        }
        return false;
    };
    FileLib.write = function (file, object) {
        if (FileLib.nioFiles.exists(file)) {
            var writer = FileLib.nioFiles.newBufferedWriter(file);
            writer.write(JSON.stringify(object));
            writer.close();
            return;
        }
        throw "File " + file + " does not exists!";
    };
    FileLib.read = function (file) {
        var reader = FileLib.nioFiles.newBufferedReader(file);
        var line, text = '';
        while ((line = reader.readLine()) != null) {
            text += line;
        }
        reader.close();
        try {
            return JSON.parse(text);
        }
        catch (err) {
            return text;
        }
    };
    FileLib.resolve = function (string) {
        var worldDir = this.getWorldDir();
        return worldDir.resolve(string);
    };
    FileLib.getWorldDir = function () {
        var DimensionManager = Java.type('net.minecraftforge.common.DimensionManager');
        return DimensionManager.getCurrentSaveRootDirectory().toPath();
    };
    FileLib.nioFiles = Java.type('java.nio.file.Files');
    FileLib.ioFile = Java.type('java.io.File');
    return FileLib;
}());
