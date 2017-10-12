'use strict';

const electron = require('electron');
const fs = require('fs');
const menuTemplate = require('./menu.js');

// Copy config file to appData if no config file exists in appData
function copyConfigFile(destPath, appDataPath) {

    if (!fs.existsSync(appDataPath)) fs.mkdirSync(appDataPath);

    if (!fs.existsSync(destPath)) {
        console.log('Create config.json at ' + destPath);
        var config = JSON.stringify({"dbs":["test"]});
        fs.writeFileSync(destPath, config);
    }
}

// CONFIGURATION ---

var configSourcePath = undefined;
if (process.argv && process.argv.length > 2) {
    configSourcePath = process.argv[2];
}
if (configSourcePath) { // is environment 'development' (npm start) or 'test' (npm run e2e)
    global.configurationPath = 'config/Configuration.json';
}


if (!configSourcePath || // is environment 'production' (packaged app)
    configSourcePath.indexOf('dev') !== -1) { // is environment 'development' (npm start)

    global.appDataPath = electron.app.getPath('appData') + '/' + electron.app.getName();
    copyConfigFile(global.appDataPath + '/config.json', global.appDataPath);
    global.configPath = global.appDataPath + '/config.json';

    if (!configSourcePath) { // is environment 'production' (packaged app)
        global.configurationPath = '../config/Configuration.json'
    }

} else { // is environment 'test' (npm run e2e)

    global.configPath = configSourcePath;
    global.appDataPath = 'test/test-temp';
}

console.log('Using config file: ' + global.configPath);
global.config = JSON.parse(fs.readFileSync(global.configPath, 'utf-8'));


// -- CONFIGURATION

// OTHER GLOBALS --

global.switches = {
    prevent_reload: false,
    destroy_before_create: false
};

if (configSourcePath && configSourcePath.indexOf('test') !== -1) { // is environment 'test'
    global.switches.prevent_reload = true;
    global.switches.destroy_before_create = true;
}



// -- OTHER GLOBALS

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow;

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
electron.app.on('ready', function createWindow() {

    const screenWidth = electron.screen.getPrimaryDisplay().workAreaSize.width;
    const screenHeight = electron.screen.getPrimaryDisplay().workAreaSize.height;

    mainWindow = new electron.BrowserWindow({
        width: screenWidth >= 1680 ? 1680 : 1280,
        height: screenHeight >= 1050 ? 1050 : 800,
        minWidth: 996,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false
        }
    });

    // mainWindow.webContents

    const menu = electron.Menu.buildFromTemplate(menuTemplate);
    electron.Menu.setApplicationMenu(menu);

    // and load the index.html of the app.
    mainWindow.loadURL('file://' + __dirname + '/index.html');

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
});

// Quit when all windows are closed.
electron.app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        electron.app.quit();
    }
});

electron.app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});
