'use strict';

const electron = require('electron');
electron.crashReporter.start({
    uploadToServer: false
});

const fs = require('original-fs');
const os = require('os');
const url = require('url');
const path = require('path');
const pathSeparator = path.sep;
const log = require('electron-log');
const autoUpdate = require('./auto-update.js');

if (global.mode !== 'development') {
    process.chdir(electron.app.getAppPath().replace('app.asar', ''));
}
log.info('Working directory:', process.cwd());

let menuContext = 'loading';

const mainLanguages = ['de', 'en', 'es', 'it', 'ko', 'pt', 'tr', 'uk'];

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
    setMapProviderSettingsDefaults(config);
    if (config.isAutoUpdateActive === undefined) config.isAutoUpdateActive = true;
    if (config.highlightCustomElements === undefined) config.highlightCustomElements = true;
    setLanguages(config);
    if (os.type() === 'Linux') config.isAutoUpdateActive = false;
    if (!config.keepBackups) {
        config.keepBackups = { custom: 0, customInterval: 0, daily: 0, weekly: 0, monthly: 0 };
    }

    return config;
};

const setMapProviderSettingsDefaults = config => {

    if (!config.mapProviderSettings || typeof config.mapProviderSettings !== 'object') {
        config.mapProviderSettings = {};
    }

    for (const key of ['kakaoLocalRestApiKey', 'kakaoMapJavaScriptKey', 'kakaoNativeAppKey']) {
        if (typeof config.mapProviderSettings[key] !== 'string') {
            config.mapProviderSettings[key] = '';
        }
    }
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
    global.appDataPath = electron.app.getPath('appData') + pathSeparator + electron.app.getName()

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

global.toolsPath = global.mode === 'production'
    ? electron.app.getAppPath().replace('app.asar', 'tools')
    : 'tools';

global.samplesPath = global.mode === 'production'
    ? electron.app.getAppPath().replace('app.asar', 'samples/')
    : './samples/';

global.manualPath = global.mode === 'production'
    ? electron.app.getAppPath().replace('app.asar', 'manual')
    : './manual';

global.imageProcessing = process.argv.includes('--alternativeImageProcessing') ? 'jimp' : 'sharp';

// -- OTHER GLOBALS

require('./services/services');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const normalizeUrlPath = parsedUrl => decodeURIComponent(parsedUrl.pathname).replace(/\\/g, '/');

const isAppUrl = urlString => {
    try {
        const appUrl = new URL(global.distUrl);
        const navigationUrl = new URL(urlString);

        if (navigationUrl.protocol !== appUrl.protocol) return false;

        if (appUrl.protocol === 'file:') {
            return normalizeUrlPath(navigationUrl).startsWith(normalizeUrlPath(appUrl));
        }

        return navigationUrl.origin === appUrl.origin
            && navigationUrl.pathname.startsWith(appUrl.pathname);
    } catch (_) {
        return false;
    }
};

const isSafeExternalUrl = urlString => {
    try {
        return ['https:', 'http:', 'mailto:'].includes(new URL(urlString).protocol);
    } catch (_) {
        return false;
    }
};

const denyBrowserPermissions = session => {
    session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
    session.setPermissionCheckHandler(() => false);
};

const getAllowedGlobal = name => {
    switch (name) {
        case 'appDataPath':
        case 'config':
        case 'configPath':
        case 'imageProcessing':
        case 'manualPath':
        case 'mode':
        case 'os':
        case 'samplesPath':
        case 'switches':
        case 'toolsPath':
            return global[name];
        default:
            throw new Error(`Blocked global access: ${name}`);
    }
};

const setUpRendererIpc = () => {
    electron.ipcMain.on('app:getAppPath', event => {
        event.returnValue = electron.app.getAppPath();
    });

    electron.ipcMain.on('app:getName', event => {
        event.returnValue = electron.app.getName();
    });

    electron.ipcMain.on('app:getPath', (event, name) => {
        event.returnValue = electron.app.getPath(name);
    });

    electron.ipcMain.on('app:getVersion', event => {
        event.returnValue = electron.app.getVersion();
    });

    electron.ipcMain.on('global:get', (event, name) => {
        event.returnValue = getAllowedGlobal(name);
    });

    electron.ipcMain.on('global:getLocale', event => {
        event.returnValue = global.getLocale();
    });

    electron.ipcMain.on('global:getMainLanguages', event => {
        event.returnValue = global.getMainLanguages();
    });

    electron.ipcMain.on('global:setConfigDefaults', (event, config) => {
        event.returnValue = global.setConfigDefaults(config);
    });

    electron.ipcMain.on('global:setMenuContext', (_event, context) => {
        global.setMenuContext(context);
    });

    electron.ipcMain.on('global:updateConfig', (_event, config) => {
        global.updateConfig(config);
    });

    electron.ipcMain.handle('dialog:showOpenDialog', (event, options) => {
        return electron.dialog.showOpenDialog(electron.BrowserWindow.fromWebContents(event.sender), options);
    });

    electron.ipcMain.handle('dialog:showSaveDialog', (event, options) => {
        return electron.dialog.showSaveDialog(electron.BrowserWindow.fromWebContents(event.sender), options);
    });
};

const createWindow = () => {

    const screenWidth = electron.screen.getPrimaryDisplay().workAreaSize.width;
    const screenHeight = electron.screen.getPrimaryDisplay().workAreaSize.height;

    mainWindow = new electron.BrowserWindow({
        width: screenWidth >= 1680 ? 1680 : 1280,
        height: screenHeight >= 1050 ? 1050 : 800,
        minWidth: 1220,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            nodeIntegrationInWorker: false,
            enableRemoteModule: false,
            contextIsolation: true,
            preload: path.join(electron.app.getAppPath(), 'electron/preload.js'),
            sandbox: false,
            webSecurity: global.mode === 'production',
            allowRunningInsecureContent: false,
            webviewTag: false,
            navigateOnDragDrop: false,
            backgroundThrottling: false
        },
        titleBarStyle: 'hiddenInset',
        title: 'Field Desktop'
    });

    denyBrowserPermissions(mainWindow.webContents.session);

    if (os.platform() === 'linux' && global.mode === 'production') {
        const iconPath = path.join(
            electron.app.getAppPath().replace('app.asar', 'icons'),
            'logo256x256.png'
        );
        mainWindow.setIcon(electron.nativeImage.createFromPath(iconPath));
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

    mainWindow.webContents.on('will-attach-webview', event => {
        event.preventDefault();
    });

    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        if (isAppUrl(navigationUrl)) return;

        event.preventDefault();
        if (isSafeExternalUrl(navigationUrl)) electron.shell.openExternal(navigationUrl);
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (isSafeExternalUrl(url)) electron.shell.openExternal(url);
        return { action: 'deny' };
    });
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
    setUpRendererIpc();

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
                pathname: path.join(__dirname, '/../dist/' + global.getLocale() + '/index.html'),
                protocol: 'file:',
                slahes: true,
                hash: route
            })
        );
    } else {
        mainWindow.reload();
    }
});
