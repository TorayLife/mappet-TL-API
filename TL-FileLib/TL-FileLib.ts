abstract class FileLib{

	static nioFiles = Java.type('java.nio.file.Files');
	static ioFile = Java.type('java.io.File');


	static getPath(str){
		return (typeof str == 'object') ? str.join('/') : str;
	}
	static create(path, fileName) {
		let worldDir = this.getWorldDir();
		let dir = (typeof path == 'object') ? worldDir.resolve(path.join('/')) : worldDir.resolve(path);
		if(!FileLib.nioFiles.exists(dir)){
			FileLib.nioFiles.createDirectories(dir);
		}
		let file = dir.resolve(fileName);
		if (!FileLib.nioFiles.exists(file)) {
			return FileLib.nioFiles.createFile(file);
		}
		throw `File ${path}/${fileName} already exists!`;
	}
	static rename(file,newName){
		let dir = file.getParent();
		let newFile = dir.resolve(newName);
		file.toFile().renameTo(newFile.toFile());
		return newFile;
	}
	static delete(file) {
		if (FileLib.nioFiles.exists(file)) {
			file.toFile().delete();
			return;
		}
		throw `File ${file} does not exists!`;
	}
	static get(path, fileName) {
		let worldDir = this.getWorldDir();
		let dir = worldDir.resolve(this.getPath(path));
		let file = dir.resolve(fileName);
		if (FileLib.nioFiles.exists(file)) {
			return file;
		}
		throw `File ${path}/${fileName} does not exists!`;
	}
	static has(path, fileName) {
		let worldDir = this.getWorldDir();
		let dir = worldDir.resolve(this.getPath(path));
		let file = dir.resolve(fileName);
		if (FileLib.nioFiles.exists(file)) {
			return true;
		}
		return false;
	}
	static write(file, object) {
		if (FileLib.nioFiles.exists(file)) {
			let writer = FileLib.nioFiles.newBufferedWriter(file);
			writer.write(JSON.stringify(object));
			writer.close();
			return;
		}
		throw `File ${file} does not exists!`;
	}
	static read(file) {
		let reader = FileLib.nioFiles.newBufferedReader(file);
		let line, text = '';
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
	}
	static resolve(string){
		let worldDir = this.getWorldDir();
		return worldDir.resolve(string);
	}
	static getWorldDir() {
		let DimensionManager = Java.type('net.minecraftforge.common.DimensionManager');
		return DimensionManager.getCurrentSaveRootDirectory().toPath();
	}
}