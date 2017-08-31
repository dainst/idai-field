import {browser} from 'protractor';
import {NavbarPage} from '../navbar.page';
import * as PouchDB from 'pouchdb';
import {SettingsPage} from './settings.page';

PouchDB.plugin(require('pouchdb-adapter-memory'));

const delays = require('../config/delays');
const cors = require('pouchdb-server/lib/cors');
const express = require('express');
const expressPouchDB = require('express-pouchdb');
const fs = require('fs');
const path = require('path');
const common = require('../common');

/**
 * @author Thomas Kleinke
 */
describe('settings --', function() {

    const configPath = browser.params.configPath;
    const configTemplate = browser.params.configTemplate;

    function resetConfigJson(): Promise<any> {

        return new Promise(resolve => {
            fs.writeFile(configPath, JSON.stringify(configTemplate), err => {
                if (err) console.error('Failure while resetting config.json', err);
                resolve();
            });
        });
    }

    beforeAll(done => {
        resetConfigJson().then(done);
    });

    afterEach(done => {
        resetConfigJson().then(done);
    });

    it('save syncing settings to config file and load them after restart', done => {

        SettingsPage.get();
        common.typeIn(SettingsPage.getUserNameInput(), 'settings_test_user');
        SettingsPage.clickSaveSettingsButton();

        NavbarPage.clickNavigateToExcavation()
            .then(() => {
                browser.sleep(5000);
                return SettingsPage.get().then(() => browser.sleep(2000));
            }).then(() => SettingsPage.getUserName())
            .then(username => {
                expect(username).toEqual('settings_test_user');
                done();
            }).catch(err => {
                fail(err);
                done();
            });
    });
});


