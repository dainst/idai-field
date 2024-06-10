'use strict';

const log = require('electron-log');
log.transports.file.level = 'debug';
Object.assign(console, log.functions);

const electron = require('electron');
const remoteMain = require('@electron/remote/main');
const fs = require('original-fs');
const os = require('os');
const url = require('url');
const autoUpdate = require('./auto-update.js');
require('./asynchronous-fs.js');
require('./geopackage.js');

remoteMain.initialize();

let menuContext = 'loading';

const mainLanguages = ['de', 'en', 'it', 'tr', 'uk'];

// needed to fix notifications in win 10
// see https://github.com/electron/electron/issues/10864
electron.app.setAppUserModelId('org.dainst.field');

// Copy config file to appData if no config file exists in appData
const copyConfigFile = (destPath, appDataPath) => {

    if (!fs.existsSync(appDataPath)) fs.mkdirSync(appDataPath);
    if (!fs.existsSync(destPath)) writeConfigFile(destPath);
};


const writeConfigFile = path => {

    console.log('Create config.json at ' + path);
    fs.writeFileSync(path, JSON.stringify({ 'dbs': ['test'] }));
};


global.os = os.type();


global.setConfigDefaults = config => {

    setSyncTargets(config);
    setFileSync(config);
    if (config.isAutoUpdateActive === undefined) config.isAutoUpdateActive = true;
    if (config.highlightCustomElements === undefined) config.highlightCustomElements = true;
    setLanguages(config);
    if (os.type() === 'Linux') config.isAutoUpdateActive = false;

    return config;
};

const setFileSync = config => {

    Object.values(config.syncTargets).map((target) => {
        if (typeof target.activeFileSync !== 'undefined' && target.activeFileSync.every(i => typeof i === "string")) {
            let updatedConfig = []
            // Migration for version 3.1 image sync rework: Set upload and download active for all active variants.

            updatedConfig = target.activeFileSync.map((variant) => {
                return {
                    upload: true,
                    download: true,
                    variant: variant
                }
            })

            target.fileSyncPreferences = updatedConfig;
            delete target.activeFileSync;
            return;
        }

        if (typeof target.fileSyncPreferences === 'undefined') {
            // Migration for version 3 image sync rework: activating thumbnail sync by default.

            target.fileSyncPreferences = [{
                upload: true,
                download: true,
                variant: 'thumbnail_image' // see ImageVariant enum
            }];
            return;
        }
    })
}

const setSyncTargets = config => {

    if (!config.syncTargets) {
        config.syncTargets = config.syncTarget && config.dbs
            ? config.dbs.reduce((result, db) => {
                if (db !== 'test') {
                    result[db] = {
                        address: config.syncTarget.address,
                        password: config.syncTarget.password,
                        isSyncActive: config.isSyncActive
                    };
                }
                return result;
            }, {})
            : {};

        delete config.syncTarget;
    }
}


const setLanguages = config => {

    if (!config.languages || config.languages.length === 0) {
        if (global.mode === 'test') {
            config.languages = ['de'];
        } else if (config.locale) {
            // Use value from deprecated locale setting if existing
            config.languages = [config.locale];
        } else {
            const locale = getLocale();
            config.languages = mainLanguages.includes(locale)
                ? [locale]
                : ['en'];
        }
    }

    config.languages = config.languages
        .concat(mainLanguages.filter(language => !config.languages.includes(language)));
};


const getLocale = () => {

    return electron.app.getLocale()
        .replace('_', '-')
        .split('-')[0];
};


global.getLocale = () => global.config.languages.find(language => mainLanguages.includes(language));

global.getMainLanguages = () => mainLanguages;


global.updateConfig = config => {

    global.config = config;
    createMenu();
};


global.setMenuContext = context => {

    const oldContext = menuContext;
    menuContext = context;
    if (oldContext !== menuContext) createMenu();
};


// CONFIGURATION ---

let env = undefined;
if (process.argv && process.argv.length > 2) {
    env = process.argv[2];
}

if (env === 'dev') {
    global.mode = 'development';
} else if (env === 'test') {
    global.mode = 'test';
} else {
    global.mode = 'production';
}

if (['production', 'development'].includes(global.mode)) {

    // If we want to go from idai-field-client to idai-field-desktop while keeping the link to the existing dbs, use this:
    // const result = electron.app.getPath('userData').replace("idai-field-desktop", "idai-field-client")
    // electron.app.setPath('userData', result).
    // global.appDataPath = result
    // The next line can then be removed.
    global.appDataPath = electron.app.getPath('appData') + '/' + electron.app.getName()

    copyConfigFile(global.appDataPath + '/config.json', global.appDataPath);
    global.configPath = global.appDataPath + '/config.json';
} else {
    global.configPath = 'test/config/config.test.json';
    global.appDataPath = 'test/test-temp';
}

// -- CONFIGURATION


// OTHER GLOBALS --

global.switches = {
    prevent_reload: false,
    destroy_before_create: false,
    messages_timeout: 3500,
    suppress_map_load_for_test: false,
    provide_reset: false
};

if (global.mode === 'test') {
    global.switches.messages_timeout = undefined;
    global.switches.prevent_reload = true;
    global.switches.destroy_before_create = true;
    global.switches.suppress_map_load_for_test = true;
    global.switches.provide_reset = true;
}

global.toolsPath = global.mode === 'production' ?
    electron.app.getAppPath().replace('app.asar', 'tools')
    : 'tools';

global.samplesPath = global.mode === 'production'
    ? electron.app.getAppPath().replace('app.asar', 'samples/')
    : './samples/';

global.manualPath = global.mode === 'production'
    ? electron.app.getAppPath().replace('app.asar', 'manual')
    : './manual';

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true;
process.env['NODE_OPTIONS'] = '--no-deprecation';


// -- OTHER GLOBALS

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;


const createWindow = () => {

    const screenWidth = electron.screen.getPrimaryDisplay().workAreaSize.width;
    const screenHeight = electron.screen.getPrimaryDisplay().workAreaSize.height;

    mainWindow = new electron.BrowserWindow({
        width: screenWidth >= 1680 ? 1680 : 1280,
        height: screenHeight >= 1050 ? 1050 : 800,
        minWidth: 1220,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false,
            preload: require('path').join(electron.app.getAppPath(), 'electron/preload.js'),
            webSecurity: global.mode === 'production'
        },
        titleBarStyle: 'hiddenInset'
    });

    remoteMain.enable(mainWindow.webContents);

    if (require('os').platform() === 'linux' && global.mode === 'production') {
        const path = require('path').join(
            electron.app.getAppPath().replace('app.asar', 'icons'),
            'logo256x256.png'
        );
        mainWindow.setIcon(electron.nativeImage.createFromPath(path));
    }

    setTimeout(() => {
        mainWindow.loadURL(global.distUrl + 'index.html');
    }, 100);

    let closed = false;
    
    mainWindow.on('close', (event) => {
        if (closed) return;
        event.preventDefault();
        mainWindow.webContents.send('requestClose');
    });

    electron.ipcMain.on('close', () => {
        closed = true;
        mainWindow = null;
        electron.app.quit();
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        electron.shell.openExternal(url);
        return { action: 'deny' };
    });

    return mainWindow;
};


const loadConfig = () => {

    try {
        global.config = global.setConfigDefaults(
            JSON.parse(fs.readFileSync(global.configPath, 'utf-8'))
        );
    } catch (err) {
        console.warn('Failed to parse config.json:', err);
        writeConfigFile(global.configPath);
        loadConfig();
    }
};


const createMenu = () => {

    const menu = electron.Menu.buildFromTemplate(require('./menu.js')(mainWindow, menuContext, global.config));
    electron.Menu.setApplicationMenu(menu);
};


electron.app.allowRendererProcessReuse = false;
if (global.mode !== 'production') {
    electron.app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
electron.app.on('ready', () => {
    loadConfig();

    global.distUrl = global.mode === 'production'
        ? 'file://' + __dirname + '/../dist/' + global.getLocale() + '/'
        : 'http://localhost:4200/dist/';

    createWindow();
    createMenu();

    if (global.config.isAutoUpdateActive) autoUpdate.setUp(mainWindow);

    electron.ipcMain.on('settingsChanged', (event, settings) => {
        if (settings.isAutoUpdateActive) autoUpdate.setUp(mainWindow);
    });
});


electron.ipcMain.on('reload', (event, route) => {
    if (global.mode === 'production') {
        mainWindow.loadURL(
            url.format({
                pathname: require('path').join(__dirname, '/../dist/' + global.getLocale() + '/index.html'),
                protocol: 'file:',
                slahes: true,
                hash: route
            })
        );
    } else {
        mainWindow.reload();
    }
});
