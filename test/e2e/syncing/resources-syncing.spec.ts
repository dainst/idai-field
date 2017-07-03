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
import {SettingsPage} from '../settings/settings.page';


/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
describe('resources/syncing --', function() {

    const remoteSiteAddress = 'http://localhost:3001';
    const configPath = browser.params.configPath;
    const configTemplate = browser.params.configTemplate;

    let db, server, changes;
    let testResource = {
        id: "td1",
        identifier:"test1",
        type: "trench",
        shortDescription: "Testobjekt",
        relations: []
    };
    let testDocument: any = {
        _id: testResource.id,
        resource: testResource,
        created: {
            date: new Date(),
            user: 'testuser'
        }
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
            .then(() => NavbarPage.clickNavigateToProject())
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
            .then(() => NavbarPage.clickNavigateToProject());
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

    it('show resource created in other db', done => {

        NavbarPage.clickNavigateToProject();
        waitForIt('test1', () => {
            expect(resourcesPage.getListItemIdentifierText(0)).toBe('test1');
            done();
        });
    });

    it('show changes made in other db', done => {

        NavbarPage.clickNavigateToProject()
            .then(() => {
                testDocument.resource.identifier = 'test2';
                updateTestDoc();
            }).then(() => waitForIt('test2', () => {
                expect(resourcesPage.getListItemIdentifierText(0)).toBe('test2');
                done();
            }));
    });

    it('resource created in client should be synced to other db', done => {

        NavbarPage.clickNavigateToProject()
            .then(() => {
                changes = db.changes({since: 'now', live: true, include_docs: true}).on('change', change => {
                    if (change.doc.resource && change.doc.resource.identifier == 'test3')
                        done();
                });
                resourcesPage.performCreateResource('test3');
            }).catch(err => { fail(err); done(); });
    });

    it('solve an immediate conflict by reloading the latest revision', done => {

        NavbarPage.clickNavigateToProject()
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

    it('solve an immediate conflict by overwriting the latest revision', done => {

        NavbarPage.clickNavigateToProject()
            .then(() => waitForIt('test1', () => {
                resourcesPage.clickSelectResource('test1')
                    .then(documentViewPage.clickEditDocument)
                    .then(() => {
                        testDocument.resource.identifier = 'test2';
                        updateTestDoc();
                    }).then(DocumentEditWrapperPage.clickSaveDocument)
                    .then(DocumentEditWrapperPage.clickConflictModalSaveButton)
                    .then(documentViewPage.clickEditDocument)
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

    it('detect an eventual conflict and mark the corresponding resource list item', done => {

        return NavbarPage.clickNavigateToProject()
            .then(() => waitForIt('test1', () => {
                expect(resourcesPage.getListItemEl('test1').getAttribute('class')).not.toContain('conflicted');

                createEventualConflict()
                    .then(() => {
                        browser.wait(EC.visibilityOf(resourcesPage.getListItemEl('test1')), delays.ECWaitTime);
                        expect(resourcesPage.getListItemEl('test1').getAttribute('class')).toContain('conflicted');
                        done();
                    }).catch(err => { fail(err); done(); });
            }));
    });

    it('solve an eventual conflict', done => {

        let shortDescription = '';

        return NavbarPage.clickNavigateToProject()
            .then(() => waitForIt('test1', () => {
                createEventualConflict()
                    .then(() => { return db.get(testDocument._id); })
                    .then(doc => {
                        shortDescription = doc.resource.shortDescription;
                        expect(['Test Local', 'Test Remote']).toContain(shortDescription);
                    })
                    .then(() => resourcesPage.clickSelectResource('test1'))
                    .then(() => resourcesPage.clickSelectResource('test1'))
                    .then(documentViewPage.clickEditDocument)
                    .then(DocumentEditWrapperPage.clickConflictsTab)
                    .then(DocumentEditWrapperPage.clickChooseRightRevision)
                    .then(DocumentEditWrapperPage.clickSolveConflictButton)
                    .then(DocumentEditWrapperPage.clickSaveDocument)
                    .then(() => {
                        expect(resourcesPage.getListItemEl('test1').getAttribute('class')).not.toContain('conflicted');
                        return db.get(testDocument._id);
                    }).then(doc => {
                        expect(['Test Local', 'Test Remote']).toContain(doc.resource.shortDescription);
                        expect(doc.resource.shortDescription).not.toEqual(shortDescription);
                        done();
                    });
            }));
    });

    it('open conflict resolver via taskbar', done => {

        return NavbarPage.clickNavigateToProject()
            .then(() => waitForIt('test1', () => {
                createEventualConflict()
                    .then(NavbarPage.clickConflictsButton)
                    .then(() => NavbarPage.clickConflictResolverLink('test1'))
                    .then(() => {
                        browser.wait(EC.visibilityOf(element(by.id('conflict-resolver'))), delays.ECWaitTime);
                        done();
                    });
            }));
    });

    it('open conflict resolver via conflict button in document view', done => {

        return NavbarPage.clickNavigateToProject()
            .then(() => waitForIt('test1', () => {
                createEventualConflict()
                    .then(NavbarPage.clickNavigateToProject)
                    .then(() => resourcesPage.clickSelectResource('test1'))
                    .then(documentViewPage.clickSolveConflicts)
                    .then(() => {
                        browser.wait(EC.visibilityOf(element(by.id('conflict-resolver'))), delays.ECWaitTime);
                        done();
                    });
            }));
    });

});
