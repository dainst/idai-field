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

    function resetConfigJson(): Promise<any> {

        return new Promise(resolve => {
            fs.writeFile(configPath, JSON.stringify(configTemplate), err => {
                if (err) console.error('Failure while resetting config.json', err);
                resolve();
            });
        });
    }

    function configureRemoteSite() {

        common.typeIn(SettingsPage.getRemoteSiteAddressInput(), remoteSiteAddress);
        SettingsPage.clickSaveSettingsButton();
        browser.sleep(5000);
    }

    beforeAll(done => {

        browser.sleep(2000);
        setupTestDB().then(done);
    });

    afterAll(done => {

        tearDownTestDB().then(done);
    });

    beforeEach(() => {
        SettingsPage.get();
        configureRemoteSite();
    });

    afterEach(() => {
        if (changes) changes.cancel();
        resetConfigJson();
    });


    it('post an eventual conflict', done => {
        return NavbarPage.clickNavigateToProject()
            .then(() => {

                return db.put(testDocumentAlternative,{force:true}).then(() => {
                    NavbarPage.clickNavigateToExcavation();
                    browser.sleep(2000);
                    expect(ResourcesPage.getListItemEl('testf1').getAttribute('class')).toContain('conflicted');

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
