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
describe('resources/conflicts --', function() {

    const remoteSiteAddress = 'http://localhost:3001';
    const configPath = browser.params.configPath;
    const configTemplate = browser.params.configTemplate;

    let db, server, changes;

    function makeDoc(id,identifier,shortDescription) {
        return {
            _id: id,
            resource: {
                "id": id,
                "identifier": identifier,
                "shortDescription": shortDescription,
                "relations": {
                    "isRecordedIn": [
                        "t1"
                    ],
                    "liesWithin": [
                        "c1"
                    ]
                },
                "type": "object",
                "_parentTypes": []
            },
            created: {
                "user": "sample_data",
                "date": "2017-07-24T16:01:10.843Z"
            },
            modified: []
        };
    }

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
        return browser.sleep(5000);
    }

    beforeAll(done => {

        browser.sleep(2000);
        setupTestDB().then(done);
    });

    afterAll(done => {

        tearDownTestDB().then(done);
    });

    beforeEach(done => {
        SettingsPage.get();
        configureRemoteSite().then(done);
    });

    afterEach(done => {
        if (changes) changes.cancel();
        resetConfigJson().then(done);
    });


    function createEventualConflict(nr) {
        const testDocument = makeDoc('tf'+nr,'testf'+nr,'Testfund'+nr);
        const testDocumentAlternative = makeDoc('tf'+nr,'testf'+nr,'Testfund'+nr+'_alternative');
        testDocumentAlternative['_rev'] = "1-dca7c53e7c0e47278b2c09744cc94b21";

        return db.put(testDocument).then(()=>browser.sleep(2000))
            .then(() => NavbarPage.clickNavigateToExcavation())
            .then(() => browser.sleep(2000))
            .then(() => {
                expect(ResourcesPage.getListItemEl('testf'+nr).getAttribute('class')).not.toContain('conflicted');
                return db.put(testDocumentAlternative,{force:true})
                    .then(()=>NavbarPage.clickNavigateToSettings())
                    .then(()=>NavbarPage.clickNavigateToExcavation())
                    .then(()=>browser.sleep(2000))
            })
    }

    function updateTestDoc(testDocument) {

        return db.put(testDocument).then(result => {
            testDocument._rev = result.rev;
            console.log("updated successfully")
        }).catch(err => console.error('Failure while updating test doc', err));
    }


    it('solve a save conflict', done => {

        const testDocument = makeDoc('tf7','testf7','Testfund7');
        return db.put(testDocument)
            .then(result => {
                testDocument['_rev'] = result.rev;

                NavbarPage.clickNavigateToExcavation();
                browser.sleep(2000);
                ResourcesPage.clickSelectResource('testf7');
                DocumentViewPage.clickEditDocument()
                    .then(() => {
                        testDocument.resource.shortDescription = 'Testfund7_alternative';
                        return updateTestDoc(testDocument);
                    }).then(() => {
                        DocumentEditWrapperPage.clickSaveDocument();
                        DocumentEditWrapperPage.clickChooseRightRevision();
                        DocumentEditWrapperPage.clickSolveConflictButton();
                        DocumentEditWrapperPage.clickSaveDocument();
                        expect(ResourcesPage.getListItemEl('testf7').getAttribute('class')).not.toContain('conflicted');
                        done();
                    }).catch(err => { fail(err); done(); });
            });
    });

    it('open conflict resolver via taskbar', done => {

        createEventualConflict('3').then(() => {

            NavbarPage.clickConflictsButton();
            NavbarPage.clickConflictResolverLink('testf3');
            browser.wait(EC.visibilityOf(element(by.id('conflict-resolver'))), delays.ECWaitTime).then(done);
        });
    });

    it('open conflict resolver via conflict button in document view', done => {

        createEventualConflict('4').then(() => {
            ResourcesPage.clickSelectResource('testf4');
            DocumentViewPage.clickSolveConflicts();
            browser.wait(EC.visibilityOf(element(by.id('conflict-resolver'))), delays.ECWaitTime).then(done);
        });
    });

    it('resolve an eventual conflict', done => {

        createEventualConflict('2').then(() => {

            expect(ResourcesPage.getListItemEl('testf2').getAttribute('class')).toContain('conflicted');

            ResourcesPage.clickSelectResource('testf2');
            ResourcesPage.clickSelectResource('testf2');
            DocumentViewPage.clickEditDocument();
            DocumentEditWrapperPage.clickConflictsTab();
            DocumentEditWrapperPage.clickChooseRightRevision();
            DocumentEditWrapperPage.clickSolveConflictButton();
            DocumentEditWrapperPage.clickSaveDocument();
            browser.sleep(2000);
            expect(ResourcesPage.getListItemEl('testf2').getAttribute('class')).not.toContain('conflicted');

            db.get('tf2').then(doc => {
                expect(['Testfund2', 'Testfund2_alternative']).toContain(doc.resource.shortDescription);
                // expect(doc.resource.shortDescription).not.toEqual(shortDescription);
                done();
            });

        }).catch(err => {
            console.error('Failure while creating test doc', err);
            fail(); done()
        });
    });
});
