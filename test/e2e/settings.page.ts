import {browser, protractor, element, by} from 'protractor';

'use strict';

let EC = protractor.ExpectedConditions;
let delays = require('./config/delays');


/**
 * @author Thomas Kleinke
 */
let SettingsPage = function() {

    this.get = function() {
        return browser.get('#/settings');
    };

    this.clickSaveSettingsButton = function() {
        browser.wait(EC.visibilityOf(element(by.id('save-settings-button'))), delays.ECWaitTime);
        element(by.id('save-settings-button')).click();
    };

    this.getRemoteSiteAddressInput = function() {
        browser.wait(EC.visibilityOf(element(by.id('sync-target-address-input'))),
            delays.ECWaitTime);
        return element(by.id('sync-target-address-input'));
    };

    this.getRemoteSiteAddress = function() {
        return this.getRemoteSiteAddressInput().getAttribute('value');
    };

    this.getUserNameInput = function() {
        browser.wait(EC.visibilityOf(element(by.id('username-input'))), delays.ECWaitTime);
        return element(by.id('username-input'));
    };
};

module.exports = new SettingsPage();