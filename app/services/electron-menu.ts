import {Injectable} from "@angular/core";
import {Router} from "@angular/router-deprecated";
import {BrowserWindow} from "electron"

/**
 * @author Sebastian Cuy
 */
@Injectable()
export class ElectronMenu {

    constructor(private router: Router) {}

    public build(): void {

        const remote = require('electron').remote;
        const Menu = remote.Menu;
        const app = remote.app;

        let template = [{
            label: 'File',
            submenu: [{
                label: 'New Item',
                accelerator: 'CmdOrCtrl+N',
                click: function(item, focusedWindow) {
                    if (focusedWindow) {
                        // TODO router is not injected (see https://stackoverflow.com/questions/36570747/angular2-router-undefined)
                        // this.router.navigate(['Overview']);
                    }
                }
            }, {
                type: 'separator'
            }, {
                label: 'Import',
                accelerator: 'CmdOrCtrl+I',
                click: function(item, focusedWindow) {
                    if (focusedWindow) {
                        // TODO add link to import component
                    }
                }
            }]
        }, {
            label: 'Edit',
            submenu: [{
                label: 'Undo',
                accelerator: 'CmdOrCtrl+Z',
                role: 'undo'
            }, {
                label: 'Redo',
                accelerator: 'Shift+CmdOrCtrl+Z',
                role: 'redo'
            }, {
                type: 'separator'
            }, {
                label: 'Cut',
                accelerator: 'CmdOrCtrl+X',
                role: 'cut'
            }, {
                label: 'Copy',
                accelerator: 'CmdOrCtrl+C',
                role: 'copy'
            }, {
                label: 'Paste',
                accelerator: 'CmdOrCtrl+V',
                role: 'paste'
            }, {
                label: 'Select All',
                accelerator: 'CmdOrCtrl+A',
                role: 'selectall'
            }]
        }, {
            label: 'View',
            submenu: [{
                label: 'Reload',
                accelerator: 'CmdOrCtrl+R',
                click: function (item, focusedWindow) {
                    if (focusedWindow) {
                        // on reload, start fresh and close any old
                        // open secondary windows
                        if (focusedWindow.id === 1) {
                            BrowserWindow.getAllWindows().forEach(function (win) {
                                if (win.id > 1) {
                                    win.close()
                                }
                            })
                        }
                        focusedWindow.reload()
                    }
                }
            }, {
                label: 'Toggle Full Screen',
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
                label: 'Toggle Developer Tools',
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
            label: 'Window',
            role: 'window',
            submenu: [{
                label: 'Minimize',
                accelerator: 'CmdOrCtrl+M',
                role: 'minimize'
            }, {
                label: 'Close',
                accelerator: 'CmdOrCtrl+W',
                role: 'close'
            }]
        }, {
            label: 'Help',
            role: 'help',
            submenu: []
        }]

        if (process.platform === 'darwin') {
            const name = app.getName()
            template.unshift({
                label: name,
                submenu: [{
                    label: `About ${name}`,
                    role: 'about'
                }, {
                    type: 'separator'
                }, {
                    label: 'Services',
                    role: 'services',
                    submenu: []
                }, {
                    type: 'separator'
                }, {
                    label: `Hide ${name}`,
                    accelerator: 'Command+H',
                    role: 'hide'
                }, {
                    label: 'Hide Others',
                    accelerator: 'Command+Alt+H',
                    role: 'hideothers'
                }, {
                    label: 'Show All',
                    role: 'unhide'
                }, {
                    type: 'separator'
                }, {
                    label: 'Quit',
                    accelerator: 'Command+Q',
                    click: function () {
                        app.quit()
                    }
                }]
            });

            // Window menu.
            template[3].submenu.push({
                type: 'separator'
            }, {
                label: 'Bring All to Front',
                role: 'front'
            });

        };

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);

    }

}