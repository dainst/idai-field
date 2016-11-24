const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

var name = app.getName();

const template = [{
    label: name,
    submenu: [{
        label: 'Über ' + name,
        role: 'about'
    }, {
        type: 'separator'
    },{
        label: 'Beenden',
        accelerator: 'Command+Q',
        click: function () {
            app.quit()
        }
    }]
},{
    label: 'Datei',
    submenu: [
        {
            label: 'Beenden',
            accelerator: 'CmdOrCtrl+Q',
            click: function () {
                app.quit()
            }
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
    submenu: [{
        label: 'Über ' + name,
        click: function createInfoWindow() {
            // new frameless window
            var infoWindow = new BrowserWindow({
                width: 300,
                height: 400,
                frame: false,
                webPreferences: {nodeIntegration: true}
            });

            // Open Browser Dev Tool for debugging
            // infoWindow.webContents.openDevTools();

            infoWindow.on('closed', () => {
                infoWindow = null;
            });
            // load new panel with version info
            infoWindow.loadURL('file://' + __dirname + '/app/desktop/info-window.html');
            //console.log(app.getVersion());
        }
    }]
}];

if (process.platform !== 'darwin') {
    template.splice(0,1);
}

module.exports = template;