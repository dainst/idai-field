'use strict';

const { autoUpdater } = require("electron-updater");
const log = require("electron-log");

autoUpdater.logger = log;

function setUp() {
    autoUpdater.checkForUpdatesAndNotify();
}

module.exports = {
    setUp: setUp
}
