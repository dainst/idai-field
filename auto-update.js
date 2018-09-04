'use strict';

const {autoUpdater} = require('electron-updater');
const log = require('electron-log');
const {dialog} = require('electron');

autoUpdater.logger = log;

let updateVersion;
let initialized = false;

const setUp = (mainWindow) => {

    if (initialized) return;

    autoUpdater.on('update-available', updateInfo => {
        updateVersion = updateInfo.version;

        dialog.showMessageBox({
            type: 'info',
            title: 'Update verfügbar',
            message: 'Eine neue Version von iDAI.field (' + updateInfo.version + ') ist verfügbar. '
                + 'Möchten Sie sie herunterladen und installieren?',
            buttons: ['Ja', 'Nein']
        }, (buttonIndex) => {
            if (buttonIndex === 0) {
                autoUpdater.downloadUpdate();
            }
        });
    });

    autoUpdater.on('download-progress', progress => {
        mainWindow.webContents.send('downloadProgress', {
            progressPercent: progress.percent,
            version: updateVersion
        });
    });

    autoUpdater.on('update-downloaded', updateInfo => {
        mainWindow.webContents.send('updateDownloaded');

        dialog.showMessageBox({
            title: 'Update installieren',
            message: 'Version ' + updateInfo.version + ' von iDAI.field wurde geladen. '
                + 'Starten Sie die Anwendung neu, um sie zu installieren.'
        });
    });

    autoUpdater.checkForUpdates();
    initialized = true;
};

autoUpdater.autoDownload = false;

module.exports = {
    setUp: setUp
};
