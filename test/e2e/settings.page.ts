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

    this.clickAddRemoteSiteButton = function() {
        browser.wait(EC.visibilityOf(element(by.id('add-remote-site-button'))), delays.ECWaitTime);
        element(by.id('add-remote-site-button')).click();
    };

    this.clickRemoveRemoteSiteButton = function() {
        browser.wait(EC.visibilityOf(element(by.id('remote-sites-list')).all(by.css('button')).get(0)),
            delays.ECWaitTime);
        element(by.id('remote-sites-list')).all(by.css('button')).get(0).click();
    };

    this.getRemoteSiteAddressInput = function() {
        browser.wait(EC.visibilityOf(element(by.id('remote-sites-list')).all(by.css('input')).get(0)),
            delays.ECWaitTime);
        return element(by.id('remote-sites-list')).all(by.css('input')).get(0);
    };

    this.getRemoteSiteAddress = function() {
        return this.getRemoteSiteAddressInput().getAttribute('value');
    };

    this.getUserNameInput = function() {
        browser.wait(EC.visibilityOf(element(by.id('user-name-input'))), delays.ECWaitTime);
        return element(by.id('user-name-input'));
    };

    this.getServerUserNameInput = function() {
        browser.wait(EC.visibilityOf(element(by.id('server-user-name-input'))), delays.ECWaitTime);
        return element(by.id('server-user-name-input'));
    };

    this.getServerPasswordInput = function() {
        browser.wait(EC.visibilityOf(element(by.id('server-password-input'))), delays.ECWaitTime);
        return element(by.id('server-password-input'));
    };
};

module.exports = new SettingsPage();