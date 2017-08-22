'use strict';

const electron = require('electron');
const menuTemplate = require('./menu.js');
const Menu = electron.Menu;
const fs = require('fs');

// Module to control application life.
const app = electron.app;

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow;

// Load configuration
if (process.argv.length > 2) {
  global.configurationPath = 'config/Configuration.json';
  global.configPath = process.argv[2];
} else {
  global.configurationPath = '../config/Configuration.json';
  global.configPath = process.resourcesPath + '/config/config.json';
}

if (global.configPath.indexOf('config.test.json') == -1) {
  global.appDataPath = electron.app.getPath('appData') + '/' + electron.app.getName();
  var appDataConfigPath = global.appDataPath + '/config.json';
  copyConfigFile(global.configPath, appDataConfigPath);
  global.configPath = appDataConfigPath;
} else {
    global.appDataPath = 'test/test-temp';
}

global.config = JSON.parse(fs.readFileSync(global.configPath, 'utf-8'));
console.log('Using config file: ' + global.configPath);

// Copy config file to appData if no config file exists in appData
function copyConfigFile(srcPath, destPath) {

  if (!fs.existsSync(destPath)) {
    var config = fs.readFileSync(srcPath, 'utf-8');
    fs.writeFileSync(destPath, config);
  }
}

function createWindow() {

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false
    }
  });

  // mainWindow.webContents

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

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
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
