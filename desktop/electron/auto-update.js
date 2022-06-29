'use strict';

const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const { ipcMain, BrowserWindow, dialog, app } = require('electron');
const messages = require('./messages');

autoUpdater.logger = log;

let updateVersion;
let started = false;


const setUp = async (mainWindow) => {

    if (started) return;
    started = true;

    autoUpdater.on('update-available', async updateInfo => {
        updateVersion = updateInfo.version;
        const infoText = messages.get('autoUpdate.available.message.1')
            + updateInfo.version
            + messages.get('autoUpdate.available.message.2');

        const modal = new BrowserWindow({
            parent: mainWindow,
            modal: true,
            width: 400,
            height: 500,
            frame: false,
            resizable: false,
            show: false,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true
            }
        });

        modal.loadFile(require('path').join(app.getAppPath(), '/electron/auto-update-modal.html'));
        modal.webContents.on('did-finish-load', () => {
            modal.webContents.executeJavaScript(
                'document.getElementById("info-text").textContent = "' + infoText + '"; ' +
                'document.getElementById("release-notes").innerHTML = "' + updateInfo.releaseNotes.replace(/"/g, '\\"').replace(/\n/g, '') + '"; ' +
                'document.getElementById("yes-button").textContent = "' + messages.get('autoUpdate.available.yes') + '"; ' +
                'document.getElementById("no-button").textContent = "' + messages.get('autoUpdate.available.no') + '"; ' +
                'document.getElementById("question").textContent = "' + messages.get('autoUpdate.available.message.3') + '";'
            );
            modal.show();
        });

        ipcMain.on('confirm-auto-update', () => {
            modal.close();
            mainWindow.webContents.send('downloadProgress', {
                progressPercent: 0,
                version: updateVersion
            });
            autoUpdater.downloadUpdate();
        });

        ipcMain.on('decline-auto-update', () => {
            modal.close();
        });
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
