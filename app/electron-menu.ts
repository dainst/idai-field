import {Injectable} from "@angular/core";
import {ImportController} from "./import/import-controller";

/**
 * @author Sebastian Cuy
 */
@Injectable()
export class ElectronMenu {

    constructor(
        private importController: ImportController) {}

    public build(): void {

        const remote = require('electron').remote;
        const Menu = remote.Menu;
        const app = remote.app;

        let template = [{
            label: 'Datei',
            submenu: [{
                label: 'Neue Ressource',
                accelerator: 'CmdOrCtrl+N',
                click: function(item, focusedWindow) {
                    if (focusedWindow) {
                        // TODO bind this to use router
                        // TODO use component router instead of router deprecated
                        // this.router.navigate(['Overview']);
                    }
                }
            }, {
                type: 'separator'
            }, {
                label: 'Ressourcen importieren',
                accelerator: 'CmdOrCtrl+I',
                click: function(item, focusedWindow) {
                    if (focusedWindow) {
                        this.importResources();
                    }
                }.bind(this)
            }]
        }, {
            label: 'Bearbeiten',
            submenu: [{
                label: 'Rückgängig',
                accelerator: 'CmdOrCtrl+Z',
                role: 'undo'
            }, {
                label: 'Wiederholen',
                accelerator: 'Shift+CmdOrCtrl+Z',
                role: 'redo'
            }, {
                type: 'separator'
            }, {
                label: 'Ausschneiden',
                accelerator: 'CmdOrCtrl+X',
                role: 'cut'
            }, {
                label: 'Kopieren',
                accelerator: 'CmdOrCtrl+C',
                role: 'copy'
            }, {
                label: 'Einfügen',
                accelerator: 'CmdOrCtrl+V',
                role: 'paste'
            }, {
                label: 'Alle auswählen',
                accelerator: 'CmdOrCtrl+A',
                role: 'selectall'
            }]
        }, {
            label: 'Anzeige',
            submenu: [{
                label: 'Neu laden',
                accelerator: 'CmdOrCtrl+R',
                click: function (item, focusedWindow) {
                    if (focusedWindow) focusedWindow.reload();
                }
            }, {
                label: 'Vollbild An/Aus',
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
                label: 'Developer Tools an-/ausschalten',
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
            label: 'Fenster',
            role: 'window',
            submenu: [{
                label: 'Minimieren',
                accelerator: 'CmdOrCtrl+M',
                role: 'minimize'
            }, {
                label: 'Schließen',
                accelerator: 'CmdOrCtrl+W',
                role: 'close'
            }]
        }, {
            label: 'Hilfe',
            role: 'help',
            submenu: []
        }]

        if (process.platform === 'darwin') {
            const name = app.getName()
            template.unshift({
                label: name,
                submenu: [{
                    label: `Über ${name}`,
                    role: 'about'
                }, {
                    type: 'separator'
                }, {
                    label: 'Dienste',
                    role: 'services',
                    submenu: []
                }, {
                    type: 'separator'
                }, {
                    label: `Verstecke ${name}`,
                    accelerator: 'Command+H',
                    role: 'hide'
                }, {
                    label: 'Andere verstecken',
                    accelerator: 'Command+Alt+H',
                    role: 'hideothers'
                }, {
                    label: 'Alle anzeigen',
                    role: 'unhide'
                }, {
                    type: 'separator'
                }, {
                    label: 'Beenden',
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
                label: 'Alle nach vorne bringen',
                role: 'front'
            });

        };

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);

    }
    
    private importResources() {
        const {dialog} = require('electron').remote;

        var filepaths = dialog.showOpenDialog({
            properties: [ 'openFile' ],
            title: "Importieren",
            filters: [ { name: 'JSON-Lines-Datei', extensions: ['jsonl'] } ]
        });
        
        this.importController.importResourcesFromFile(filepaths[0]);
    }

    

}