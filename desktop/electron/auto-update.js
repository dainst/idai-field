'use strict';

const {autoUpdater} = require('electron-updater');
const log = require('electron-log');
const {dialog} = require('electron');
const messages = require('./messages');

autoUpdater.logger = log;

let updateVersion;
let started = false;


const setUp = async (mainWindow) => {

    if (started) return;
    started = true;

    autoUpdater.on('update-available', async updateInfo => {
        updateVersion = updateInfo.version;

        const result = await dialog.showMessageBox({
            type: 'info',
            title: messages.get('autoUpdate.available.title'),
            message: messages.get('autoUpdate.available.message.1')
                + updateInfo.version
                + messages.get('autoUpdate.available.message.2'),
            buttons: [messages.get('autoUpdate.available.yes'), messages.get('autoUpdate.available.no')],
            noLink: true
        });

        if (result.response === 0) {
            mainWindow.webContents.send('downloadProgress', {
                progressPercent: 0,
                version: updateVersion
            });
            autoUpdater.downloadUpdate();
        }
    });

    autoUpdater.on('download-progress', progress => {
        mainWindow.webContents.send('downloadProgress', {
            progressPercent: progress.percent,
            version: updateVersion
        });
    });

    autoUpdater.on('update-downloaded', async updateInfo => {
        mainWindow.webContents.send('updateDownloaded', updateInfo);

        await dialog.showMessageBox({
            title: messages.get('autoUpdate.downloaded.title'),
            message: messages.get('autoUpdate.downloaded.message.1')
                + updateInfo.version
                + messages.get('autoUpdate.downloaded.message.2'),
            noLink: true
        });
    });

    autoUpdater.on('error', () => {
        mainWindow.webContents.send('downloadInterrupted');
    });

    process.on('uncaughtException', () => {
       mainWindow.webContents.send('downloadInterrupted');
    });

    await autoUpdater.checkForUpdates();
};

autoUpdater.autoDownload = false;

module.exports = {
    setUp: setUp
};
