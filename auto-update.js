'use strict';

const {autoUpdater} = require('electron-updater');
const log = require('electron-log');
const {dialog} = require('electron');

autoUpdater.logger = log;

let updateVersion;
let initialized = false;

const messages = {
    de: {
        'updateAvailable.title': 'Update verfügbar',
        'updateAvailable.message.1': 'Eine neue Version von iDAI.field (',
        'updateAvailable.message.2': ') ist verfügbar. Möchten Sie sie herunterladen und installieren?',
        'updateAvailable.yes': 'Ja',
        'updateAvailable.no': 'Nein',
        'updateDownloaded.title': 'Update installieren',
        'updateDownloaded.message.1': 'Version ',
        'updateDownloaded.message.2': ' von iDAI.field wurde geladen. Starten Sie die Anwendung neu, um sie zu '
            + 'installieren.'
    },
    en: {
        'updateAvailable.title': 'Update available',
        'updateAvailable.message.1': 'A new version of iDAI.field (',
        'updateAvailable.message.2': ') is available. Do you want to download and install it?',
        'updateAvailable.yes': ' Yes ',
        'updateAvailable.no': ' No ',
        'updateDownloaded.title': 'Install update',
        'updateDownloaded.message.1': 'Version ',
        'updateDownloaded.message.2': ' of iDAI.field has been downloaded. Please restart the application to install '
            + 'it.'
    },
};


const setUp = (mainWindow, locale) => {

    if (initialized) return;

    autoUpdater.on('update-available', updateInfo => {
        updateVersion = updateInfo.version;

        dialog.showMessageBox({
            type: 'info',
            title: messages[locale]['updateAvailable.title'],
            message: messages[locale]['updateAvailable.message.1']
                + updateInfo.version
                + messages[locale]['updateAvailable.message.2'],
            buttons: [messages[locale]['updateAvailable.yes'], messages[locale]['updateAvailable.no']],
            noLink: true
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
            title: messages[locale]['updateDownloaded.title'],
            message: messages[locale]['updateDownloaded.message.1']
                + updateInfo.version
                + messages[locale]['updateDownloaded.message.2'],
            noLink: true
        });
    });

    autoUpdater.checkForUpdates();
    initialized = true;
};

autoUpdater.autoDownload = false;

module.exports = {
    setUp: setUp
};
