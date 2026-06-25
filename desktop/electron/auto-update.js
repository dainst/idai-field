'use strict';

const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const { ipcMain, BrowserWindow, app } = require('electron');
const path = require('path');
const messages = require('./messages');

autoUpdater.logger = log;

let updateVersion;
let started = false;

const modalPreload = () => path.join(app.getAppPath(), 'electron/modals/preload.js');


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
                nodeIntegration: false,
                contextIsolation: true,
                preload: modalPreload()
            }
        });

        modal.loadFile(path.join(app.getAppPath(), '/electron/modals/auto-update-modal.html'));
        modal.webContents.on('did-finish-load', async () => {
            modal.webContents.send('auto-update-available-data', {
                heading: messages.get('autoUpdate.available.info'),
                version: updateVersion,
                releaseNotes: updateInfo.releaseNotes,
                yesButton: messages.get('autoUpdate.available.yes'),
                noButton: messages.get('autoUpdate.available.no'),
                warning: messages.get('autoUpdate.available.warning'),
                question: messages.get('autoUpdate.available.question'),
                withBorder: process.platform !== 'darwin'
            });
            modal.show();
        });
        modal.on('close', () => {
            modal.getParentWindow().focus();
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
                nodeIntegration: false,
                contextIsolation: true,
                preload: modalPreload()
            }
        });

        modal.loadFile(path.join(app.getAppPath(), '/electron/modals/download-finished-modal.html'));
        modal.webContents.on('did-finish-load', async () => {
            modal.webContents.send('download-finished-data', {
                heading: messages.get('autoUpdate.downloaded.title'),
                infoMessage,
                okButton: messages.get('autoUpdate.downloaded.ok'),
                withBorder: process.platform !== 'darwin'
            });
            modal.show();
        });
        modal.on('close', () => {
            modal.getParentWindow().focus();
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
