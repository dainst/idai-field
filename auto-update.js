'use strict';

const { autoUpdater } = require("electron-updater");
const log = require("electron-log");
const { dialog } = require('electron')

autoUpdater.logger = log;

function setUp() {
    autoUpdater.checkForUpdates();
}

autoUpdater.autoDownload = false;

autoUpdater.on('error', (error) => {
    dialog.showErrorBox(
        'Error: ',
        error == null ? "unknown" : (error.stack || error).toString()
    );
});

autoUpdater.on('update-available', () => {
    dialog.showMessageBox({
        type: 'info',
        title: 'Update verfügbar',
        message: 'Eine neue Version von iDAI.field ist verfügbar. Möchten Sie sie herunterladen?',
        buttons: ['Ja', 'Nein']
    }, (buttonIndex) => {
        if (buttonIndex === 0) {
            autoUpdater.downloadUpdate();
        }
    });
});

autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
        title: 'Update installieren',
        message: 'Die neue Version von iDAI.field wurde geladen. Möchten Sie die Anwendung jetzt neustarten um die neue Version zu installieren?',
        buttons: ['Ja', 'Nein']
    }, (buttonIndex) => {
        if (buttonIndex === 0) {
            autoUpdater.quitAndInstall();
        }
    });
})

module.exports = {
    setUp: setUp
}
