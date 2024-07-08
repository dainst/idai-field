const ipcRenderer = globalThis.require('electron').ipcRenderer;

globalThis.filesystem = {};
globalThis.filesystem.getFileInfos = function(paths) { return ipcRenderer.invoke('getFileInfos', paths); };
globalThis.filesystem.isFile = function(path) { return ipcRenderer.invoke('isFile', path); };
globalThis.filesystem.isDirectory = function(path) { return ipcRenderer.invoke('isDirectory', path); };
globalThis.filesystem.writeFile = function(path, contents) { return ipcRenderer.invoke('writeFile', path, contents); };
globalThis.filesystem.readFile = function(path, encoding) { return ipcRenderer.invoke('readFile', path, encoding); };
globalThis.filesystem.readdir = function(path) { return ipcRenderer.invoke('readdir', path); };
globalThis.filesystem.mkdir = function(path, options) { return ipcRenderer.invoke('mkdir', path, options); };
globalThis.filesystem.rm = function(path, options) { return ipcRenderer.invoke('rm', path, options); };
globalThis.filesystem.unlink = function(path) { return ipcRenderer.invoke('unlink', path); };
globalThis.filesystem.extractZip = function(source, destination) {
    return ipcRenderer.invoke('extractZip', source, destination);
};
globalThis.filesystem.createCatalogZip = function(outputFilePath, filePath, fileName, imageDirPath, imageDirName) {
    return ipcRenderer.invoke('createCatalogZip', outputFilePath, filePath, fileName, imageDirPath, imageDirName);
};
