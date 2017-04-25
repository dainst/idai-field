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
const resourcesPage = require('./resources.page');
const documentViewPage = require('../widgets/document-view.page');
const settingsPage = require('../settings.page');

/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
describe('resources/syncing tests --', function() {

    const remoteSiteAddress = 'http://localhost:3001/idai-field-documents-test';
    const configPath = browser.params.configPath;
    const configTemplate = browser.params.configTemplate;

    let db, server;
    let testResource = {
        id: "td1",
        identifier:"test1",
        type: "object",
        shortDescription: "Testobjekt",
        relations: []
    };
    let testDocument: any = { resource: testResource };

    function setupTestDB() {

        return new Promise(resolve => {
            let app = express();
            let pouchDbApp = expressPouchDB(PouchDB);
            app.use(cors(pouchDbApp.couchConfig));
            app.use('/', pouchDbApp);
            server = app.listen(3001, function () {
                new PouchDB('idai-field-documents-test')
                    .destroy().then(() => {
                        resolve(new PouchDB('idai-field-documents-test'));
                    });
            });
        }).then(newDb => db = newDb);
    }

    function tearDownTestDB() {

        return db.destroy()
            .then(() => server.close());
    }

    function createTestDoc() {

        return db.post(testDocument).then(result => {
            testDocument._id = result.id;
            testDocument._rev = result.rev;
        }).catch(err => console.error("Failure while creating test doc", err));
    }

    function resetTestDoc() {

        let id = testDocument._id;
        let rev = testDocument._rev;
        delete testDocument._id;
        delete testDocument._rev;
        testDocument.resource.identifier = 'test1';
        return db.remove(id, rev)
            .catch(err => console.error("Failure while removing test doc", err));
    }

    function updateTestDoc() {

        testDocument.resource.identifier = 'test2';
        return db.put(testDocument).then(result => {
            testDocument._id = result.id;
            testDocument._rev = result.rev;
        }).catch(err => console.error("Failure while updating test doc", err));
    }

    function resetConfigJson(): Promise<any> {

        return new Promise(resolve => {
            fs.writeFile(configPath, JSON.stringify(configTemplate), err => {
                if (err) console.error('Failure while resetting config.json', err);
                resolve();
            });
        });
    }

    function waitForIt(searchTerm, successCB) {

        return browser.sleep(1000).then(() =>
            resourcesPage.typeInIdentifierInSearchField(searchTerm)
        ).then(() => {
            return browser.wait(EC.visibilityOf(element(by.css('#objectList .list-group-item:nth-child(1) .identifier'))), 500).then(
                () => {
                    return successCB();
                },
                () => {
                    return waitForIt(searchTerm, successCB);
                });
        });
    }

    beforeAll(done => {

        browser.sleep(2000);
        setupTestDB().then(done);
    });

    afterAll(done => {

        tearDownTestDB().then(done);
    });

    beforeEach(done => {

        settingsPage.get();
        settingsPage.clickAddRemoteSiteButton();
        common.typeIn(settingsPage.getRemoteSiteAddressInput(), remoteSiteAddress);
        settingsPage.clickSaveSettingsButton();

        createTestDoc().then(done);
    });

    afterEach(done => {

        resetTestDoc()
            .then(() => resetConfigJson())
            .then(() => done());
    });

    it('should show resource created in other db', () => {

        NavbarPage.clickNavigateToResources();
        waitForIt('test1', () => {
            expect(resourcesPage.getListItemIdentifierText(0)).toBe('test1');
        });

    }, 30000);

    it('should show changes made in other db', () => {

        NavbarPage.clickNavigateToResources()
            .then(updateTestDoc)
            .then(() => waitForIt('test2', () => expect(resourcesPage.getListItemIdentifierText(0)).toBe('test2')));

    }, 30000);

    xit('resource created in client should be synced to other db', done => {

        NavbarPage.clickNavigateToResources();
        db.changes({ since: 'now', live: true, include_docs: true }).on('change', change => {
            if (change.doc.resource && change.doc.resource.identifier == 'test3')
                done();
        });
        resourcesPage.performCreateResource('test3');
    }, 100000);

    it('should detect conflict on save', done => {

        NavbarPage.clickNavigateToResources()
            .then(() => resourcesPage.typeInIdentifierInSearchField('test1'))
            .then(() => resourcesPage.clickSelectResource('test1'))
            .then(() => documentViewPage.clickEditDocument())
            .then(updateTestDoc)
            .then(() => DocumentEditWrapperPage.clickSaveDocument())
            .then(done)
            .catch(err => { fail(err); done(); });
    });

    it('should save syncing settings to config file and load them after restart', done => {

        const expectedConfig = {
            'environment': 'test',
            'userName': 'userName',
            'server': {
                'userName': 'serverUserName',
                'password': 'serverPassword'
            },
            'remoteSites': [ { 'ipAddress': remoteSiteAddress } ]
        };

        common.typeIn(settingsPage.getUserNameInput(), 'userName');
        common.typeIn(settingsPage.getServerUserNameInput(), 'serverUserName');
        common.typeIn(settingsPage.getServerPasswordInput(), 'serverPassword');
        settingsPage.clickSaveSettingsButton();
        NavbarPage.clickNavigateToResources()
            .then(() => {
                browser.sleep(2000);
                const loadedConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
                expect(loadedConfig).toEqual(expectedConfig);
                return settingsPage.get();
            }).then(() => settingsPage.getRemoteSiteAddress())
            .then(address => {
                expect(address).toEqual(remoteSiteAddress);
                done();
            }).catch(err => { fail(err); done(); })
    });

});