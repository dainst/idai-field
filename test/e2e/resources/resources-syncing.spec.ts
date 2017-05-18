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

    const remoteSiteAddress = 'http://localhost:3001';
    const configPath = browser.params.configPath;
    const configTemplate = browser.params.configTemplate;

    let db, server, changes;
    let testResource = {
        id: "td1",
        identifier:"test1",
        type: "object",
        shortDescription: "Testobjekt",
        relations: []
    };
    let testDocument: any = { _id: testResource.id, resource: testResource };

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

    function tearDownTestDB() {

        return db.destroy()
            .then(() => server.close());
    }

    function createTestDoc() {

        return db.post(testDocument).then(result => {
            testDocument._rev = result.rev;
        }).catch(err => console.error("Failure while creating test doc", err));
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
            }).catch(err => console.error("Failure while resetting test doc", err));
    }

    function updateTestDoc() {

        return db.put(testDocument).then(result => {
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

        return browser.sleep(3000).then(() =>
            resourcesPage.typeInIdentifierInSearchField(searchTerm)
        ).then(() => {
            return browser.wait(EC.visibilityOf(
                    element(by.css('#objectList .list-group-item:nth-child(1) .identifier'))), 500).then(
                () => {
                    return successCB();
                },
                () => {
                    return waitForIt(searchTerm, successCB);
                });
        });
    }

    function configureRemoteSite() {

        settingsPage.clickAddRemoteSiteButton();
        common.typeIn(settingsPage.getRemoteSiteAddressInput(), remoteSiteAddress);
        settingsPage.clickSaveSettingsButton();
        browser.sleep(5000);
    }

    function removeRemoteSiteConfiguration() {

        settingsPage.clickRemoveRemoteSiteButton();
        settingsPage.clickSaveSettingsButton();
        browser.sleep(5000);
    }

    function createConflict(): Promise<any> {

        return NavbarPage.clickNavigateToSettings()
            .then(() => removeRemoteSiteConfiguration())
            .then(() => NavbarPage.clickNavigateToResources())
            .then(() => resourcesPage.clickSelectResource('test1'))
            .then(documentViewPage.clickEditDocument)
            .then(() => DocumentEditWrapperPage.typeInInputField('Test Local', 1))
            .then(DocumentEditWrapperPage.clickSaveDocument)
            .then(() => {
                testDocument.resource.shortDescription = 'Test Remote';
                updateTestDoc();
            })
            .then(() => NavbarPage.clickNavigateToSettings())
            .then(() => configureRemoteSite())
            .then(NavbarPage.clickNavigateToResources);
    }

    beforeAll(done => {

        browser.sleep(2000);
        setupTestDB().then(done);
    });

    afterAll(done => {

        tearDownTestDB().then(done);
    });

    beforeEach(done => {

        createTestDoc().then(done);
    });

    afterEach(done => {

        if (changes) changes.cancel();

        resetTestDoc()
            .then(() => resetConfigJson())
            .then(() => done());
    });

    it('should show resource created in other db', done => {

        settingsPage.get();
        configureRemoteSite();
        NavbarPage.clickNavigateToResources();
        waitForIt('test1', () => {
            expect(resourcesPage.getListItemIdentifierText(0)).toBe('test1');
            done();
        });
    });

    it('should show changes made in other db', done => {

        settingsPage.get();
        configureRemoteSite();
        NavbarPage.clickNavigateToResources()
            .then(() => {
                testDocument.resource.identifier = 'test2';
                updateTestDoc();
            }).then(() => waitForIt('test2', () => {
                expect(resourcesPage.getListItemIdentifierText(0)).toBe('test2');
                done();
            }));
    });

    it('resource created in client should be synced to other db', done => {

        settingsPage.get();
        configureRemoteSite();
        NavbarPage.clickNavigateToResources()
            .then(() => {
                changes = db.changes({since: 'now', live: true, include_docs: true}).on('change', change => {
                    if (change.doc.resource && change.doc.resource.identifier == 'test3')
                        done();
                });
                resourcesPage.performCreateResource('test3');
            }).catch(err => { fail(err); done(); });
    });

    it('should save syncing settings to config file and load them after restart', done => {

        const expectedConfig = {
            'userName': 'userName',
            'server': {
                'userName': 'serverUserName',
                'password': 'serverPassword'
            },
            'remoteSites': [ { 'ipAddress': remoteSiteAddress } ],
            'dbs' : ['test']
        };

        settingsPage.get();
        settingsPage.clickAddRemoteSiteButton();
        common.typeIn(settingsPage.getRemoteSiteAddressInput(), remoteSiteAddress);
        common.typeIn(settingsPage.getUserNameInput(), 'userName');
        common.typeIn(settingsPage.getServerUserNameInput(), 'serverUserName');
        common.typeIn(settingsPage.getServerPasswordInput(), 'serverPassword');
        settingsPage.clickSaveSettingsButton();

        NavbarPage.clickNavigateToResources()
            .then(() => {
                browser.sleep(5000);
                const loadedConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
                expect(loadedConfig).toEqual(expectedConfig);
                return settingsPage.get();
            }).then(() => settingsPage.getRemoteSiteAddress())
            .then(address => {
                expect(address).toEqual(remoteSiteAddress);
                done();
            }).catch(err => { fail(err); done(); })
    });

    it('should solve an immediate conflict by reloading the latest revision', done => {

        settingsPage.get();
        configureRemoteSite();
        NavbarPage.clickNavigateToResources()
            .then(() => waitForIt('test1', () => {
                resourcesPage.clickSelectResource('test1')
                    .then(documentViewPage.clickEditDocument)
                    .then(() => {
                        testDocument.resource.identifier = 'test2';
                        updateTestDoc();
                    }).then(DocumentEditWrapperPage.clickSaveDocument)
                    .then(DocumentEditWrapperPage.clickConflictModalReloadButton)
                    .then(() => {
                        expect<any>(DocumentEditWrapperPage.getInputFieldValue(0)).toEqual('test2');
                        done();
                    }).catch(err => { fail(err); done(); });
            }));
    });

    it('should solve an immediate conflict by overwriting the latest revision', done => {

        settingsPage.get();
        configureRemoteSite();
        NavbarPage.clickNavigateToResources()
            .then(() => waitForIt('test1', () => {
                resourcesPage.clickSelectResource('test1')
                    .then(documentViewPage.clickEditDocument)
                    .then(() => {
                        testDocument.resource.identifier = 'test2';
                        updateTestDoc();
                    }).then(DocumentEditWrapperPage.clickSaveDocument)
                    .then(DocumentEditWrapperPage.clickConflictModalSaveButton)
                    .then(() => {
                        expect<any>(DocumentEditWrapperPage.getInputFieldValue(0)).toEqual('test1');
                        DocumentEditWrapperPage.clickSaveDocument();
                    }).then(() => { return db.get(testDocument._id); })
                    .then(doc => {
                        expect(doc.resource.identifier).toEqual('test1');
                        done();
                    }).catch(err => { fail(err); done(); });
            }));
    });


    it('should detect an eventual conflict and mark the corresponding resource list item', done => {

        settingsPage.get();
        configureRemoteSite();
        return NavbarPage.clickNavigateToResources()
            .then(() => waitForIt('test1', () => {
                browser.wait(EC.visibilityOf(resourcesPage.getListItemEl('test1')), delays.ECWaitTime);
                expect(resourcesPage.getListItemEl('test1').getAttribute('class')).not.toContain('conflicted');

                createConflict()
                    .then(() => {
                        browser.wait(EC.visibilityOf(resourcesPage.getListItemEl('test1')), delays.ECWaitTime);
                        expect(resourcesPage.getListItemEl('test1').getAttribute('class')).toContain('conflicted');
                        done();
                    }).catch(err => { fail(err); done(); });
            }));
    });

    it('should solve an eventual conflict', done => {

        let shortDescription = '';

        settingsPage.get();
        configureRemoteSite();
        return NavbarPage.clickNavigateToResources()
            .then(() => waitForIt('test1', () => {
                createConflict()
                    .then(() => { return db.get(testDocument._id); })
                    .then(doc => {
                        shortDescription = doc.resource.shortDescription;
                        expect(['Test Local', 'Test Remote']).toContain(shortDescription);
                    }).then(() => resourcesPage.clickSelectResource('test1'))
                    .then(documentViewPage.clickEditDocument)
                    .then(DocumentEditWrapperPage.clickConflictsTab)
                    .then(DocumentEditWrapperPage.clickChooseRightRevision)
                    .then(DocumentEditWrapperPage.clickSolveConflictButton)
                    .then(DocumentEditWrapperPage.clickSaveDocument)
                    .then(() => {
                        browser.wait(EC.stalenessOf(element(by.id('document-edit-conflicts-tab'))), delays.ECWaitTime);
                        expect(resourcesPage.getListItemEl('test1').getAttribute('class')).not.toContain('conflicted');
                        return db.get(testDocument._id);
                    }).then(doc => {
                        expect(['Test Local', 'Test Remote']).toContain(doc.resource.shortDescription);
                        expect(doc.resource.shortDescription).not.toEqual(shortDescription);
                        done();
                    });
            }));
    });

});