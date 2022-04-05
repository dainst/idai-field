const ipcRenderer = window.require('electron').ipcRenderer;

window.filesystem = {};
window.filesystem.stat = function(path) { return ipcRenderer.invoke('stat', path); };
window.filesystem.writeFile = function(path, contents) { return ipcRenderer.invoke('writeFile', path, contents); };
window.filesystem.readFile = function(path, encoding) { return ipcRenderer.invoke('readFile', path, encoding); };
window.filesystem.readdir = function(path) { return ipcRenderer.invoke('readdir', path); };
window.filesystem.mkdir = function(path, options) { return ipcRenderer.invoke('mkdir', path, options); };
window.filesystem.rm = function(path, options) { return ipcRenderer.invoke('rm', path, options); };
window.filesystem.unlink = function(path) { return ipcRenderer.invoke('unlink', path); };
