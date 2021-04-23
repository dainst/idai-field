const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const messages = require('./messages');


const getTemplate = (mainWindow, context) => {

    const template = [{
        label: 'iDAI.field',
        submenu: [{
            label: messages.get('menu.about'),
            role: 'about'
        }, {
            type: 'separator'
        }, {
            label: messages.get('menu.settings'),
            accelerator: 'CmdOrCtrl+,',
            click: () => mainWindow.webContents.send('menuItemClicked', 'settings'),
            enabled: context === 'default'
        }]
    }, {
        label: messages.get('menu.file'),
        submenu: [
            {
                label: messages.get('menu.file.import'),
                accelerator: 'CmdOrCtrl+I',
                click: () => mainWindow.webContents.send('menuItemClicked', 'import'),
                enabled: context === 'default'
            }, {
                label: messages.get('menu.file.export'),
                accelerator: 'CmdOrCtrl+E',
                click: () => mainWindow.webContents.send('menuItemClicked', 'export'),
                enabled: context === 'default'
            }, {
                type: 'separator'
            }, {
                label: messages.get('menu.settings'),
                accelerator: 'CmdOrCtrl+Alt+S',
                click: () => mainWindow.webContents.send('menuItemClicked', 'settings'),
                enabled: context === 'default'
            },
            {
                label: messages.get('menu.file.exit'),
                accelerator: 'CmdOrCtrl+Q',
                click: function () {
                    app.quit()
                }
            }]
    }, {
        label: messages.get('menu.edit'),
        submenu: [{
            label: messages.get('menu.edit.undo'),
            accelerator: 'CmdOrCtrl+Z',
            role: 'undo'
        }, {
            label: messages.get('menu.edit.redo'),
            accelerator: 'Shift+CmdOrCtrl+Z',
            role: 'redo'
        }, {
            type: 'separator'
        }, {
            label: messages.get('menu.edit.cut'),
            accelerator: 'CmdOrCtrl+X',
            role: 'cut'
        }, {
            label: messages.get('menu.edit.copy'),
            accelerator: 'CmdOrCtrl+C',
            role: 'copy'
        }, {
            label: messages.get('menu.edit.paste'),
            accelerator: 'CmdOrCtrl+V',
            role: 'paste'
        }, {
            label: messages.get('menu.edit.selectAll'),
            accelerator: 'CmdOrCtrl+A',
            role: 'selectall'
        }]
    }, {
        label: messages.get('menu.tools'),
        submenu: [
        {
            label: messages.get('menu.tools.images'),
            accelerator: 'CmdOrCtrl+B',
            click: () => mainWindow.webContents.send('menuItemClicked', 'images'),
            enabled: context === 'default'
        },
        {
            label: messages.get('menu.tools.types'),
            accelerator: 'CmdOrCtrl+T',
            click: () => mainWindow.webContents.send('menuItemClicked', 'resources/types'),
            enabled: context === 'default'
        },
        {
            label: messages.get('menu.tools.matrix'),
            accelerator: 'CmdOrCtrl+Y',
            click: () => mainWindow.webContents.send('menuItemClicked', 'matrix'),
            enabled: context === 'default'
        }, {
            type: 'separator'
        }, {
            label: messages.get('menu.tools.backupCreation'),
            click: () => mainWindow.webContents.send('menuItemClicked', 'backup-creation'),
            enabled: context === 'default'
        }, {
            label: messages.get('menu.tools.backupLoading'),
            click: () => mainWindow.webContents.send('menuItemClicked', 'backup-loading'),
            enabled: context === 'default'
        }]
    }, {
        label: messages.get('menu.view'),
        submenu: [{
            label: messages.get('menu.view.reload'),
            accelerator: 'CmdOrCtrl+R',
            click: function (item, focusedWindow) {
                if (focusedWindow) {
                  focusedWindow.reload();
                  if (global.mode === 'production') {
                    focusedWindow.loadURL('file://' + __dirname + '/../dist/' + global.getLocale() + '/index.html');
                  }
                }
            }
        }, {
            label: messages.get('menu.view.toggleFullscreen'),
            accelerator: (function () {
                if (process.platform === 'darwin') {
                    return 'Ctrl+Command+F'
                } else {
                    return 'F11'
                }
            })(),
            click: function (item, focusedWindow) {
                if (focusedWindow) {
                    focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
                }
            }
        }, {
            label: messages.get('menu.view.toggleDeveloperTools'),
            accelerator: (function () {
                if (process.platform === 'darwin') {
                    return 'Alt+Command+I'
                } else {
                    return 'Ctrl+Shift+I'
                }
            })(),
            click: function (item, focusedWindow) {
                if (focusedWindow) {
                    focusedWindow.toggleDevTools()
                }
            }
        }]
    }, {
        label: messages.get('menu.window'),
        role: 'window',
        submenu: [{
            label: messages.get('menu.window.minimize'),
            accelerator: 'CmdOrCtrl+M',
            role: 'minimize'
        }]
    }, {
        label: messages.get('menu.help'),
        role: 'help',
        submenu: [{
            label: messages.get('menu.about'),
            click: function createInfoWindow() {
                var infoWindow = new BrowserWindow({
                    width: 300,
                    height: 350,
                    frame: false,
                    resizable: false,
                    parent: BrowserWindow.getFocusedWindow(),
                    modal: true,
                    show: false,
                    webPreferences: {
                        nodeIntegration: true,
                        contextIsolation: false,
                        enableRemoteModule: true
                    }
                });

                infoWindow.once('ready-to-show', function() {
                    infoWindow.show();
                });

                infoWindow.loadURL(global.distUrl + '/info/info-window.html');
            }
        }, {
            label: messages.get('menu.help'),
            accelerator: 'CmdOrCtrl+H',
            click: () => mainWindow.webContents.send('menuItemClicked', 'help'),
            enabled: context === 'default'
        }, {
            label: messages.get('menu.help.configuration'),
            accelerator: 'CmdOrCtrl+F',
            click: () => mainWindow.webContents.send('menuItemClicked', 'configuration'),
            enabled: context === 'default'
        }]
    }];

    if (process.platform === 'darwin') {
        // Remove 'Settings' option from 'File' menu
        template[1].submenu.splice(3, 1);

        // Remove 'about' option from 'Help' menu
        template[6].submenu.splice(0, 1);
    } else {
        // Remove 'iDAI.field' menu
        template.splice(0, 1);
    }

    return template;
};


module.exports = getTemplate;
