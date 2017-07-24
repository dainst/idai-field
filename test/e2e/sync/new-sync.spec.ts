import {browser, protractor, element, by} from 'protractor';
import {DocumentEditWrapperPage} from '../widgets/document-edit-wrapper.page';
import {NavbarPage} from '../navbar.page';
import * as PouchDB from 'pouchdb';
import {ResourcesPage} from '../resources/resources.page';
import {DocumentViewPage} from '../widgets/document-view.page';
import {SettingsPage} from '../settings/settings.page';

PouchDB.plugin(require('pouchdb-adapter-memory'));
let EC = protractor.ExpectedConditions;
let delays = require('../config/delays');
const cors = require('pouchdb-server/lib/cors');
const express = require('express');
const expressPouchDB = require('express-pouchdb');
const fs = require('fs');
const path = require('path');
const common = require('../common');

/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
describe('resources/newsync --', function() {

    const remoteSiteAddress = 'http://localhost:3001';
    const configPath = browser.params.configPath;
    const configTemplate = browser.params.configTemplate;

    let db, server, changes;
    let testResource = {
        id: 'td1',
        identifier:'test1',
        type: 'trench',
        shortDescription: 'Testobjekt',
        relations: { 'isRecordedIn': [ 'test' ] }
    };
    let testDocument: any = {
        _id: testResource.id,
        resource: testResource,
        created: {
            date: new Date(),
            user: 'testuser'
        }
    };
    const testDocumentAlternative: any = {
        _id: "tf1",
        resource: {
            "id": "tf1",
            "identifier": "testf1",
            "shortDescription": "Testfund_alternative",
            "relations": {
                "isRecordedIn": [
                    "t1"
                ],
                "liesWithin": [
                    "c1"
                ]
            },
            "geometry": {
                "type": "Point",
                "coordinates": [
                    27.1892609283,
                    39.1411810096
                ],
                "crs": "local"
            },
            "type": "object",
            "_parentTypes": []
        },
        created: {
            "user": "sample_data",
            "date": "2017-07-24T16:01:10.843Z"
        },
        modified: [],
        _rev: "1-dca7c53e7c0e47278b2c09744cc94b20"
    };


    function setupTestDB() {

        return new Promise(resolve => {
            let app = express();
            let pouchDbApp = expressPouchDB(PouchDB);
            app.use(cors(pouchDbApp.couchConfig));
            app.use('/', pouchDbApp);
            server = app.listen(3001, function() {
                new PouchDB('test')
                    .destroy().then(() => {
                    resolve(new PouchDB('test'));
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
            testDocument._rev = result.rev;
        }).catch(err => console.error('Failure while creating test doc', err));
    }

    function resetTestDoc() {

        testDocument.resource.identifier = 'test1';
        testDocument.resource.shortDescription = 'Testobjekt';

        return db.get(testDocument._id, { conflicts: true })
            .then(doc => {
                testDocument._rev = doc._rev;

                let promises = [];
                if (doc._conflicts) {
                    for (let revisionId of doc._conflicts) {
                        promises.push(db.remove(doc._id, revisionId));
                    }
                }

                return Promise.all(promises);
            }).catch(err => console.error('Failure while resetting test doc', err));
    }

    function updateTestDoc() {

        return db.put(testDocument).then(result => {
            testDocument._rev = result.rev;
        }).catch(err => console.error('Failure while updating test doc', err));
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

        return browser.sleep(3000).then(() =>
            ResourcesPage.typeInIdentifierInSearchField(searchTerm)
        ).then(() => {
            return browser.wait(EC.visibilityOf(
                element(by.css('#objectList .list-group-item:nth-child(1) .title'))), 500).then(
                () => {
                    return successCB();
                },
                () => {
                    return waitForIt(searchTerm, successCB);
                });
        });
    }

    function configureRemoteSite() {

        common.typeIn(SettingsPage.getRemoteSiteAddressInput(), remoteSiteAddress);
        SettingsPage.clickSaveSettingsButton();
        browser.sleep(5000);
    }

    function removeRemoteSiteConfiguration() {

        common.typeIn(SettingsPage.getRemoteSiteAddressInput(), ' ');
        SettingsPage.clickSaveSettingsButton();
        browser.sleep(5000);
    }

    function createEventualConflict() {

        return NavbarPage.clickNavigateToSettings()
            .then(() => removeRemoteSiteConfiguration())
    }

    beforeAll(done => {

        browser.sleep(2000);
        setupTestDB().then(done);
    });

    afterAll(done => {

        tearDownTestDB().then(done);
    });

    beforeEach(done => {

        createTestDoc()
            .then(
                ()=> {
                    SettingsPage.get();
                    configureRemoteSite();
                })
            .then(done);
    });

    afterEach(done => {

        if (changes) changes.cancel();

        resetTestDoc()
            .then(() => resetConfigJson())
            .then(done);
    });


    it('post an eventual conflict', done => {
        return NavbarPage.clickNavigateToProject()
            .then(() => {

                return db.put(testDocumentAlternative,{force:true}).then(result => {
                    NavbarPage.clickNavigateToExcavation();
                    browser.sleep(2000);

                    ResourcesPage.clickSelectResource('testf1');
                    ResourcesPage.clickSelectResource('testf1');
                    DocumentViewPage.clickEditDocument();
                    DocumentEditWrapperPage.clickConflictsTab();
                    DocumentEditWrapperPage.clickChooseRightRevision();
                    DocumentEditWrapperPage.clickSolveConflictButton();
                    DocumentEditWrapperPage.clickSaveDocument();
                    expect(ResourcesPage.getListItemEl('testf1').getAttribute('class')).not.toContain('conflicted');

                    db.get(testDocumentAlternative._id).then(doc => {
                        expect(['Testfund', 'Testfund_alternative']).toContain(doc.resource.shortDescription);
                        // expect(doc.resource.shortDescription).not.toEqual(shortDescription);
                        done();
                    });

                }).catch(err => {
                    console.error('Failure while creating test doc', err);
                    fail(); done()
                });
            });

    });
});
