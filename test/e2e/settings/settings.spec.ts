import {browser, protractor, element, by} from 'protractor';
let EC = protractor.ExpectedConditions;
let delays = require('../config/delays');
import {DocumentEditWrapperPage} from '../widgets/document-edit-wrapper.page';
import {NavbarPage} from '../navbar.page';
import * as PouchDB from 'pouchdb';
PouchDB.plugin(require('pouchdb-adapter-memory'));
const cors = require('pouchdb-server/lib/cors');
const express = require('express');
const expressPouchDB = require('express-pouchdb');
const fs = require('fs');
const path = require('path');

const common = require('../common');
const resourcesPage = require('../resources/resources.page');
const documentViewPage = require('../widgets/document-view.page');
const settingsPage = require('../settings.page');


/**
 * @author Thomas Kleinke
 */
describe('settings --', function() {

    const remoteSiteAddress = 'http://localhost:3001';
    const configPath = browser.params.configPath;

    let db, server;

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


    it('save syncing settings to config file and load them after restart', done => {

        const expectedConfig = {
            'username': 'username',
            'syncTarget': {'address': remoteSiteAddress},
            'dbs': ['test']
        };

        settingsPage.get();
        common.typeIn(settingsPage.getRemoteSiteAddressInput(), remoteSiteAddress);
        common.typeIn(settingsPage.getUserNameInput(), 'username');
        settingsPage.clickSaveSettingsButton();

        NavbarPage.clickNavigateToResources()
            .then(() => {
                browser.sleep(5000);
                const loadedConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
                expect(loadedConfig).toEqual(expectedConfig);
                return settingsPage.get().then(() => browser.sleep(2000))
            }).then(() => settingsPage.getRemoteSiteAddress())
            .then(address => {
                expect(address).toEqual(remoteSiteAddress);
                done();
            }).catch(err => {
            fail(err);
            done();
        })
    });
});


