const { ipcMain, BrowserWindow, app } = require('electron');
const messages = require('./messages');


const getTemplate = (mainWindow, context, config) => {

    const template = [{
        label: 'Field',
        submenu: [{
            label: messages.get('menu.about'),
            role: 'about'
        }, {
            type: 'separator'
        }, {
            label: messages.get('menu.settings'),
            accelerator: 'CmdOrCtrl+,',
            click: () => mainWindow.webContents.send('menuItemClicked', 'settings'),
            enabled: isDefaultContext(context)
        }]
    }, {
        label: messages.get('menu.project'),
        submenu: [
            {
                label: messages.get('menu.project.newProject'),
                accelerator: 'CmdOrCtrl+N',
                click: () => mainWindow.webContents.send('menuItemClicked', 'createProject'),
                enabled: isDefaultContext(context)
            }, {
                label: messages.get('menu.project.downloadProject'),
                accelerator: 'CmdOrCtrl+D',
                click: () => mainWindow.webContents.send('menuItemClicked', 'downloadProject'),
                enabled: isDefaultContext(context)
            }, {
                type: 'separator'
            }, {
                label: messages.get('menu.project.openProject'),
                enabled: isDefaultContext(context) && getProjectNames(true).length > 0,
                submenu: getProjectNames(true).map(projectName => {
                    return {
                        label: projectName,
                        click: () => mainWindow.webContents.send('menuItemClicked', 'openProject', projectName),
                        enabled: isDefaultContext(context)
                    };
                })
            }, {
                label: messages.get('menu.project.deleteProject'),
                enabled: isDefaultContext(context) && getProjectNames(false).length > 0,
                submenu: getProjectNames(false).map(projectName => {
                    return {
                        label: projectName,
                        click: () => mainWindow.webContents.send('menuItemClicked', 'deleteProject', projectName),
                        enabled: isDefaultContext(context)
                    };
                })
            }, {
                type: 'separator'
            }, {
                label: messages.get('menu.project.projectInfo'),
                click: () => mainWindow.webContents.send('menuItemClicked', 'projectInformation'),
                enabled: isDefaultContext(context)
            }, {
                label: messages.get('menu.project.projectProperties'),
                click: () => mainWindow.webContents.send('menuItemClicked', 'editProject'),
                enabled: isDefaultContext(context)
            }, {
                label: messages.get('menu.project.projectImages'),
                click: () => mainWindow.webContents.send('menuItemClicked', 'projectImages'),
                enabled: isDefaultContext(context)
            }, {
                label: messages.get('menu.project.projectSynchronization'),
                click: () => mainWindow.webContents.send('menuItemClicked', 'projectSynchronization'),
                enabled: isDefaultContext(context)
                    && global.config.dbs && global.config.dbs.length > 0 && global.config.dbs[0] !== 'test'
            }, {
                type: 'separator'
            }, {
                label: messages.get('menu.project.backupCreation'),
                click: () => mainWindow.webContents.send('menuItemClicked', 'backup-creation'),
                enabled: isDefaultContext(context)
            }, {
                label: messages.get('menu.project.backupLoading'),
                click: () => mainWindow.webContents.send('menuItemClicked', 'backup-loading'),
                enabled: isDefaultContext(context)
            },
            {
                type: 'separator'
            }, {
                label: messages.get('menu.project.exit'),
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
        name: 'tools',
        label: messages.get('menu.tools'),
        submenu: [
        {
            label: messages.get('menu.tools.configuration'),
            accelerator: 'CmdOrCtrl+P',
            click: () => mainWindow.webContents.send('menuItemClicked', 'configuration'),
            enabled: isDefaultContext(context)
        }, {
            type: 'separator'
        }, {
            label: messages.get('menu.tools.images'),
            accelerator: 'CmdOrCtrl+B',
            click: () => mainWindow.webContents.send('menuItemClicked', 'images'),
            enabled: isDefaultContext(context)
        }, {
            label: messages.get('menu.tools.types'),
            accelerator: 'CmdOrCtrl+T',
            click: () => mainWindow.webContents.send('menuItemClicked', 'resources/types'),
            enabled: isDefaultContext(context)
        }, {
            label: messages.get('menu.tools.matrix'),
            accelerator: 'CmdOrCtrl+Y',
            click: () => mainWindow.webContents.send('menuItemClicked', 'matrix'),
            enabled: isDefaultContext(context)
        }, {
            type: 'separator'
        },  {
            label: messages.get('menu.tools.import'),
            accelerator: 'CmdOrCtrl+I',
            click: () => mainWindow.webContents.send('menuItemClicked', 'import'),
            enabled: isDefaultContext(context)
        }, {
            label: messages.get('menu.tools.export'),
            accelerator: 'CmdOrCtrl+E',
            click: () => mainWindow.webContents.send('menuItemClicked', 'export'),
            enabled: isDefaultContext(context)
        }, {
            type: 'separator'
        }, {
            label: messages.get('menu.settings'),
            accelerator: 'CmdOrCtrl+Alt+S',
            click: () => mainWindow.webContents.send('menuItemClicked', 'settings'),
            enabled: isDefaultContext(context)
        },]
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
            accelerator: (function() {
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
                const modal = new BrowserWindow({
                    width: 300,
                    height: 370,
                    frame: false,
                    transparent: true,
                    resizable: false,
                    parent: BrowserWindow.getFocusedWindow(),
                    modal: true,
                    show: false,
                    webPreferences: {
                        nodeIntegration: true,
                        contextIsolation: false
                    }
                });
                modal.loadFile(require('path').join(app.getAppPath(), '/electron/modals/info-modal.html'));

                modal.webContents.on('did-finish-load', async () => {
                    await modal.webContents.executeJavaScript(
                        'document.getElementById("about-version").textContent = "' + app.getVersion() + '"; ' +
                        'document.getElementById("close-button").textContent = "' + messages.get('info.close') + '";' +
                        (process.platform !== 'darwin'
                            ? 'document.getElementById("modal-container").classList.add("with-border");'
                            : ''
                        )
                    );
                    modal.show();
                });
                modal.on('close', () => {
                    parentWindow.focus();
                });

                ipcMain.once('close-info-modal', () => {
                    modal.close();
                });
            }
        }, {
            label: messages.get('menu.help'),
            accelerator: 'CmdOrCtrl+H',
            click: () => mainWindow.webContents.send('menuItemClicked', 'help'),
            enabled: isDefaultContext(context)
        }]
    }];

    if (process.platform === 'darwin') {
        // Remove 'Settings' option & separator from 'Tools' menu
        template[3].submenu.splice(8, 2);

        // Remove 'about' option from 'Help' menu
        template[6].submenu.splice(0, 1);
    } else {
        // Remove 'Field' menu
        template.splice(0, 1);
    }

    if (isConfigurationContext(context)) {
        const index = template.indexOf(template.find(menu => menu.name === 'tools'));
        template.splice(index + 1, 0, {
            label: messages.get('menu.tools.configuration'),
            submenu: [{
                label: messages.get('menu.configuration.projectLanguages'),
                click: () => mainWindow.webContents.send('menuItemClicked', 'projectLanguages'),
                enabled: isDefaultContext(context)
            },
            {
                label: messages.get('menu.configuration.valuelistManagement'),
                click: () => mainWindow.webContents.send('menuItemClicked', 'valuelists'),
                enabled: isDefaultContext(context)
            }, {
                type: 'separator'
            }, {
                label: messages.get('menu.configuration.importConfiguration'),
                click: () => mainWindow.webContents.send('menuItemClicked', 'importConfiguration'),
                enabled: isDefaultContext(context)
            }, {
                type: 'separator'
            }, {
                type: 'checkbox',
                label: messages.get('menu.configuration.showHiddenFields'),
                checked: !config.hideHiddenFieldsInConfigurationEditor,
                click: () => {
                    mainWindow.webContents.send(
                        'settingChanged',
                        'hideHiddenFieldsInConfigurationEditor',
                        !config.hideHiddenFieldsInConfigurationEditor
                    );
                    config.hideHiddenFieldsInConfigurationEditor = !config.hideHiddenFieldsInConfigurationEditor;
                },
                enabled: isDefaultContext(context)
            }, {
                type: 'checkbox',
                label: messages.get('menu.configuration.highlightProjectSpecificElements'),
                checked: config.highlightCustomElements,
                click: () => {
                    mainWindow.webContents.send(
                        'settingChanged',
                        'highlightCustomElements',
                        !config.highlightCustomElements
                    );
                    config.highlightCustomElements = !config.highlightCustomElements;
                },
                enabled: isDefaultContext(context)
            }]
        });
    }

    return template;
};


const isDefaultContext = context => ['default', 'configuration'].includes(context);


const isConfigurationContext = context => [
    'configuration', 'configurationEdit', 'configurationValuelistEdit', 'configurationModal',
    'configurationManagement'
].includes(context);


const getProjectNames = (unopened) => {

    if (!global.config.dbs || global.config.dbs.length < 2) {
        return [];
    } else {
        return unopened
            ? global.config.dbs.slice(1)
            : global.config.dbs;
    }
};


module.exports = getTemplate;
