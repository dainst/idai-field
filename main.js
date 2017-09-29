'use strict';

const electron = require('electron');
const fs = require('fs');
const menuTemplate = require('./menu.js');

// Copy config file to appData if no config file exists in appData
function copyConfigFile(srcPath, destPath, appDataPath) {

    if (!fs.existsSync(appDataPath)) fs.mkdirSync(appDataPath);

    if (!fs.existsSync(destPath)) {
        console.log('Copy ' + srcPath + ' to ' + destPath);
        var config = fs.readFileSync(srcPath, 'utf-8');
        fs.writeFileSync(destPath, config);
    }
}

// CONFIGURATION ---

var configSourcePath;
if (process.argv.length > 2) { // DEVELOPMENT

    global.configurationPath = 'config/Configuration.json';
    configSourcePath = process.argv[2];

} else { // PACKAGE

    global.configurationPath = '../config/Configuration.json';
    configSourcePath = process.resourcesPath + '/config/config.json.template';
}

if (configSourcePath.indexOf('config.test.json') == -1) { // is environment 'production'

    global.appDataPath = electron.app.getPath('appData') + '/' + electron.app.getName();
    var appDataConfigPath = global.appDataPath + '/config.json';
    copyConfigFile(configSourcePath, appDataConfigPath, global.appDataPath);
    global.configPath = appDataConfigPath;

} else { // E2E TESTING

    global.configPath = configSourcePath;
    global.appDataPath = 'test/test-temp';
}

global.config = JSON.parse(fs.readFileSync(global.configPath, 'utf-8'));
console.log('Using config file: ' + global.configPath);

// -- CONFIGURATION

// OTHER GLOBALS --

global.switches = {
    prevent_reload: false,
    destroy_before_create: false
};

if (configSourcePath.indexOf('config.test.json') != -1) { // is environment 'test'
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
