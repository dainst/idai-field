const { contextBridge, ipcRenderer, webUtils } = require('electron');
const fs = require('original-fs');
const os = require('os');
const path = require('path');

const sendChannels = new Set([
    'close',
    'global:setMenuContext',
    'global:updateConfig',
    'reload',
    'settingsChanged'
]);

const invokeChannels = new Set([
    'createCatalogZip',
    'createZip',
    'extractZip',
    'getFileInfos',
    'isDirectory',
    'isFile',
    'mkdir',
    'ogr2ogr',
    'readFile',
    'readdir',
    'rm',
    'unlink',
    'writeFile'
]);

const eventChannels = new Set([
    'createConflict',
    'createMissingOrInvalidParentWarning',
    'createMissingRelationTargetWarning',
    'createNonUniqueIdentifierWarning',
    'downloadInterrupted',
    'downloadProgress',
    'menuItemClicked',
    'requestClose',
    'resetApp',
    'settingChanged',
    'updateDownloaded'
]);

const listenerMap = new WeakMap();

const send = (channel, ...args) => {
    if (!sendChannels.has(channel)) throw new Error(`Blocked IPC send channel: ${channel}`);
    ipcRenderer.send(channel, ...args);
};

const invoke = (channel, ...args) => {
    if (!invokeChannels.has(channel)) throw new Error(`Blocked IPC invoke channel: ${channel}`);
    return ipcRenderer.invoke(channel, ...args);
};

const on = (channel, listener) => {
    if (!eventChannels.has(channel)) throw new Error(`Blocked IPC event channel: ${channel}`);

    const wrapped = (_event, ...args) => listener(undefined, ...args);
    listenerMap.set(listener, wrapped);
    ipcRenderer.on(channel, wrapped);
    return () => ipcRenderer.off(channel, wrapped);
};

const off = (channel, listener) => {
    if (!eventChannels.has(channel)) throw new Error(`Blocked IPC event channel: ${channel}`);
    ipcRenderer.off(channel, listenerMap.get(listener) || listener);
    listenerMap.delete(listener);
};

const sendSync = (channel, ...args) => ipcRenderer.sendSync(channel, ...args);

const app = {
    getAppPath: () => sendSync('app:getAppPath'),
    getName: () => sendSync('app:getName'),
    getPath: name => sendSync('app:getPath', name),
    getVersion: () => sendSync('app:getVersion')
};

const remote = {
    app,
    dialog: {
        showOpenDialog: (_window, options) => ipcRenderer.invoke('dialog:showOpenDialog', options),
        showSaveDialog: (_window, options) => ipcRenderer.invoke('dialog:showSaveDialog', options)
    },
    getCurrentWindow: () => undefined,
    getGlobal: name => sendSync('global:get', name)
};

const globals = {
    get: name => sendSync('global:get', name),
    setConfigDefaults: config => sendSync('global:setConfigDefaults', config),
    updateConfig: config => send('global:updateConfig', config),
    setMenuContext: context => send('global:setMenuContext', context),
    getLocale: () => sendSync('global:getLocale'),
    getMainLanguages: () => sendSync('global:getMainLanguages')
};

const globalFunctions = {
    getLocale: globals.getLocale,
    getMainLanguages: globals.getMainLanguages,
    setConfigDefaults: globals.setConfigDefaults,
    setMenuContext: globals.setMenuContext,
    updateConfig: globals.updateConfig
};

remote.getGlobal = name => globalFunctions[name] || globals.get(name);

const filesystem = {
    getFileInfos: paths => invoke('getFileInfos', paths),
    isFile: filePath => invoke('isFile', filePath),
    isDirectory: filePath => invoke('isDirectory', filePath),
    writeFile: (filePath, contents) => invoke('writeFile', filePath, contents),
    readFile: (filePath, encoding) => invoke('readFile', filePath, encoding),
    readdir: filePath => invoke('readdir', filePath),
    mkdir: (filePath, options) => invoke('mkdir', filePath, options),
    rm: (filePath, options) => invoke('rm', filePath, options),
    unlink: filePath => invoke('unlink', filePath)
};

const fsFacade = {
    copyFileSync: (source, target) => fs.copyFileSync(source, target),
    existsSync: filePath => fs.existsSync(filePath),
    lstatSync: filePath => {
        const stat = fs.lstatSync(filePath);
        return { isFile: () => stat.isFile(), isDirectory: () => stat.isDirectory(), size: stat.size };
    },
    mkdirSync: (filePath, options) => fs.mkdirSync(filePath, options),
    readFileSync: (filePath, options) => fs.readFileSync(filePath, options),
    readdirSync: filePath => fs.readdirSync(filePath),
    rmSync: (filePath, options) => fs.rmSync(filePath, options),
    statSync: filePath => {
        const stat = fs.statSync(filePath);
        return { isFile: () => stat.isFile(), isDirectory: () => stat.isDirectory(), size: stat.size };
    },
    writeFileSync: (filePath, contents, options) => fs.writeFileSync(filePath, contents, options),
    promises: filesystem
};

const pathFacade = {
    basename: (...args) => path.basename(...args),
    dirname: (...args) => path.dirname(...args),
    extname: (...args) => path.extname(...args),
    join: (...args) => path.join(...args),
    normalize: (...args) => path.normalize(...args),
    sep: path.sep
};

const osFacade = {
    cpus: () => os.cpus(),
    type: () => os.type()
};

const electronFacade = {
    ipcRenderer: { send, invoke, on, off },
    webUtils: { getPathForFile: file => webUtils.getPathForFile(file) }
};

const electronAPI = {
    app,
    dialog: remote.dialog,
    filesystem,
    fs: fsFacade,
    globals,
    ipcRenderer: electronFacade.ipcRenderer,
    os: osFacade,
    path: pathFacade,
    remote,
    webUtils: electronFacade.webUtils
};

const expose = (name, value, { overwrite = true } = {}) => {
    if (process.contextIsolated) {
        contextBridge.exposeInMainWorld(name, value);
    } else if (overwrite || window[name] === undefined) {
        window[name] = value;
    }
};

expose('electronAPI', electronAPI);
expose('filesystem', filesystem);
