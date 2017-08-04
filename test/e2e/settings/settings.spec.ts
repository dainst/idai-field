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

    const remoteSiteAddress = 'http://localhost:3001';
    const configPath = browser.params.configPath;
    const configTemplate = browser.params.configTemplate;

    let db, server;

    function resetConfigJson(): Promise<any> {

        return new Promise(resolve => {
            fs.writeFile(configPath, JSON.stringify(configTemplate), err => {
                if (err) console.error('Failure while resetting config.json', err);
                resolve();
            });
        });
    }

    // -- this code should not be necessary but for some reason the spec hangs without it
    function setupTestDB() {

        return new Promise(resolve => {
            let app = express();
            let pouchDbApp = expressPouchDB(PouchDB);
            app.use(cors(pouchDbApp.couchConfig));
            app.use('/', pouchDbApp);
            server = app.listen(3001, function () {
                new PouchDB('test')
                    .destroy().then(() => {
                    resolve(new PouchDB('test'));
                });
            });
        }).then(newDb => db = newDb);
    }

    beforeAll(done => {

        browser.sleep(2000);
        setupTestDB().then(done);
    });
    // --

    afterEach(done => {
        resetConfigJson().then(done);
    });

    xit('save syncing settings to config file and load them after restart', done => {

        const expectedConfig = {
            'username': 'username',
            'syncTarget': {'address': remoteSiteAddress},
            'dbs': ['test']
        };

        SettingsPage.get();
        common.typeIn(SettingsPage.getRemoteSiteAddressInput(), remoteSiteAddress);
        common.typeIn(SettingsPage.getUserNameInput(), 'username');
        SettingsPage.clickSaveSettingsButton();

        NavbarPage.clickNavigateToExcavation()
            .then(() => {
                browser.sleep(5000);
                const loadedConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
                expect(loadedConfig).toEqual(expectedConfig);
                return SettingsPage.get().then(() => browser.sleep(2000));
            }).then(() => SettingsPage.getRemoteSiteAddress())
            .then(address => {
                expect(address).toEqual(remoteSiteAddress);
                done();
            }).catch(err => {
                fail(err);
                done();
            });
    });
});


