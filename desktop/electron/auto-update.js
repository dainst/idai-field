'use strict';

const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const { ipcMain, BrowserWindow, app } = require('electron');
const messages = require('./messages');

autoUpdater.logger = log;

let updateVersion;
let started = false;


const setUp = async (mainWindow) => {

    if (started) return;
    started = true;

    autoUpdater.on('update-available', async updateInfo => {
        updateVersion = updateInfo.version;

        const modal = new BrowserWindow({
            parent: mainWindow,
            modal: true,
            width: 450,
            height: 572,
            frame: false,
            transparent: true,
            resizable: false,
            show: false,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });

        modal.loadFile(require('path').join(app.getAppPath(), '/electron/modals/auto-update-modal.html'));
        modal.webContents.on('did-finish-load', async () => {
            await modal.webContents.executeJavaScript(
                'document.getElementById("heading").textContent = "' + messages.get('autoUpdate.available.info') + '"; ' +
                'document.getElementById("release-notes").innerHTML = "' + '<h2>Field Desktop ' + updateVersion + '</h2>' + updateInfo.releaseNotes.replace(/"/g, '\\"').replace(/\n/g, '') + '"; ' +
                'document.getElementById("yes-button").textContent = "' + messages.get('autoUpdate.available.yes') + '"; ' +
                'document.getElementById("no-button").textContent = "' + messages.get('autoUpdate.available.no') + '"; ' +
                'document.getElementById("update-warning").textContent = "' + messages.get('autoUpdate.available.warning') + '";' +
                'document.getElementById("info-message").textContent = "' + messages.get('autoUpdate.available.question') + '";' +
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

        ipcMain.once('confirm-auto-update', () => {
            mainWindow.webContents.send('downloadProgress', {
                progressPercent: 0,
                version: updateVersion
            });
            autoUpdater.downloadUpdate();
            modal.close();
        });

        ipcMain.once('decline-auto-update', () => {
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

        const infoMessage = messages.get('autoUpdate.downloaded.message.1')
            + updateInfo.version
            + messages.get('autoUpdate.downloaded.message.2');

        const modal = new BrowserWindow({
            parent: mainWindow,
            modal: true,
            width: 450,
            height: 175,
            frame: false,
            transparent: true,
            resizable: false,
            show: false,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });

        modal.loadFile(require('path').join(app.getAppPath(), '/electron/modals/download-finished-modal.html'));
        modal.webContents.on('did-finish-load', async () => {
            await modal.webContents.executeJavaScript(
                'document.getElementById("heading").textContent = "' + messages.get('autoUpdate.downloaded.title') + '"; ' +
                'document.getElementById("info-message").textContent = "' + infoMessage + '"; ' +
                'document.getElementById("ok-button").textContent = "' + messages.get('autoUpdate.downloaded.ok') + '";' +
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

        ipcMain.once('close-download-finished-modal', () => {
            modal.close();
        });
    });

    autoUpdater.on('error', error => {
        log.error('Error during auto update');
        log.error(error);
        mainWindow.webContents.send('downloadInterrupted');
    });

    process.on('uncaughtException', error => {
        log.error('Uncaught exception during auto update');
        log.error(error);
        mainWindow.webContents.send('downloadInterrupted');
    });

    await autoUpdater.checkForUpdates();
};

autoUpdater.autoDownload = false;

module.exports = {
    setUp: setUp
};
