'use strict';

const {autoUpdater} = require('electron-updater');
const log = require('electron-log');
const {dialog} = require('electron');
const messages = require('./messages');

autoUpdater.logger = log;

let updateVersion;
let initialized = false;


const setUp = (mainWindow) => {

    if (initialized) return;

    autoUpdater.on('update-available', updateInfo => {
        updateVersion = updateInfo.version;

        dialog.showMessageBox({
            type: 'info',
            title: messages.get('autoUpdate.available.title'),
            message: messages.get('autoUpdate.available.message.1')
                + updateInfo.version
                + messages.get('autoUpdate.available.message.2'),
            buttons: [messages.get('autoUpdate.available.yes'), messages.get('autoUpdate.available.no')],
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
            title: messages.get('autoUpdate.downloaded.title'),
            message: messages.get('autoUpdate.downloaded.message.1')
                + updateInfo.version
                + messages.get('autoUpdate.downloaded.message.2'),
            noLink: true
        });
    });

    process.on('uncaughtException', () => {
       mainWindow.webContents.send('downloadInterrupted');
    });

    autoUpdater.checkForUpdates();
    initialized = true;
};

autoUpdater.autoDownload = false;

module.exports = {
    setUp: setUp
};
