import {browser, protractor, element, by} from 'protractor';
import * as PouchDB from 'pouchdb';
import {ResourcesPage} from '../resources/resources.page';
import {DocumentViewPage} from '../widgets/document-view.page';
import {DocumentEditWrapperPage} from '../widgets/document-edit-wrapper.page';
import {SettingsPage} from '../settings/settings.page';
import {NavbarPage} from '../navbar.page';

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
describe('resources/syncing --', function() {

    const remoteSiteAddress = 'http://localhost:3001';
    const configPath = browser.params.configPath;
    const configTemplate = browser.params.configTemplate;

    let db, server, changes;

    function makeDoc(id, identifier, shortDescription) {
        return {
            _id: id,
            resource: {
                'id': id,
                'identifier': identifier,
                'shortDescription': shortDescription,
                'relations': {
                    'isRecordedIn': [
                        't1'
                    ]
                },
                'type': 'object'
            },
            created: {
                'user': 'anonymous',
                'date': '2017-07-24T16:01:10.843Z'
            },
            modified: [{
                'user': 'anonymous',
                'date': '2017-07-24T16:01:10.843Z'
            }]
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

    function setConfigJson(): Promise<any> {

        return new Promise(resolve => {
            fs.writeFile(configPath, JSON.stringify({ "syncTarget":{"address":"http://localhost:3001"}, 'dbs' : ['test'] }), err => {
                if (err) console.error('Failure while resetting config.json', err);
                resolve();
            });
        });
    }

    beforeAll(done => {

        browser.sleep(delays.shortRest * 10);
        setupTestDB().then(done);
    });

    afterAll(done => {

        tearDownTestDB().then(done);
    });

    beforeEach(done => {
        setConfigJson().then(()=>{
            SettingsPage.get().then(done);
        });
    });

    afterEach(done => {
        if (changes) changes.cancel();
        resetConfigJson().then(done);
    });

    function createOneDocument(nr, additionalFieldName?, additionalFieldValue?) {
        const testDocument = makeDoc('tf' + nr, 'testf' + nr, 'Testfund' + nr);

        if (additionalFieldName && additionalFieldValue) {
            testDocument.resource[additionalFieldName] = additionalFieldValue;
        }

        return db.put(testDocument).then(result => {
                testDocument['_rev'] = result.rev;
                return browser.sleep(delays.shortRest * 10);
            })
            .then(() => NavbarPage.clickNavigateToExcavation())
            .then(() => browser.sleep(delays.shortRest * 10))
            .then(() => {
                return Promise.resolve(testDocument);
            });
    }

    function createAlternateDocument(nr) {
        const testDocumentAlternative = makeDoc('tf' + nr, 'testf' + nr, 'Testfund' + nr + '_alternative');
        testDocumentAlternative['_rev'] = '1-dca7c53e7c0e47278b2c09744cc94b21';

        return db.put(testDocumentAlternative, { force: true })
            .then(() => {
                NavbarPage.clickNavigateToSettings();
                NavbarPage.clickNavigateToExcavation();
                return browser.sleep(delays.shortRest * 10);
            });
    }

    function createAlternateDocumentForAutoResolving(nr, additionalFieldName, additionalFieldValue) {
        const testDocumentAlternative = makeDoc('tf' + nr, 'testf' + nr, 'Testfund' + nr);
        testDocumentAlternative['_rev'] = '1-dca7c53e7c0e47278b2c09744cc94b21';
        testDocumentAlternative.resource[additionalFieldName] = additionalFieldValue;

        return db.put(testDocumentAlternative, { force: true })
            .then(() => {
                NavbarPage.clickNavigateToSettings();
                NavbarPage.clickNavigateToExcavation();
                return browser.sleep(delays.shortRest * 10);
            });
    }

    function createEventualConflict(nr) {

        return createOneDocument(nr)
            .then(() => createAlternateDocument(nr));
    }

    function createEventualConflictForAutoResolving(nr) {

        return createOneDocument(nr, 'weight', '100')
            .then(() => createAlternateDocumentForAutoResolving(nr, 'height', '50'));
    }

    function updateTestDoc(testDocument) {

        return db.put(testDocument).then(result => {
            testDocument._rev = result.rev;
        }).catch(err => console.error('Failure while updating test doc', err));
    }

    it('resolve a save conflict automatically', done => {
        const nr = '6';
        let testDocument;

        return createOneDocument(nr).then(document => {
            testDocument = document;
            ResourcesPage.clickSelectResource('testf' + nr);
            return DocumentViewPage.clickEditDocument();
        }).then(() => {
            testDocument.resource.shortDescription = 'Testfund' + nr + '_alternative';
            return updateTestDoc(testDocument);
        }).then(() => {
            DocumentEditWrapperPage.clickSaveDocument();
            expect(ResourcesPage.getListItemEl('testf' + nr).getAttribute('class'))
                .not.toContain('conflicted');
            return DocumentViewPage.getShortDescription();
        }).then(shortDescription => {
            expect(shortDescription).toEqual('Testfund' + nr + '_alternative');
            done();
        }).catch(err => { fail(err); done(); });
    })

    it('resource created in client should be synced to other db', done => {

        NavbarPage.clickNavigateToExcavation()
            .then(() => {
                changes = db.changes({since: 'now', live: true, include_docs: true}).on('change', change => {
                    if (change.doc.resource && change.doc.resource.identifier == 'test3')
                        done();
                });
                ResourcesPage.performCreateResource('test3');
            }).catch(err => { fail(err); done(); });
    });

    it('show resource created in other db', done => {
        const nr = '3';

        return createOneDocument(nr)
            .then(() => {
                ResourcesPage.getListItemEl('testf' + nr).getText().then(text => {
                    expect(text).toContain('Testfund3');
                    done();
                })
            });
    });

    it('show changes made in other db', done => {
        const nr = '4';

        return createOneDocument(nr)
            .then(testDocument => {
                testDocument.resource.shortDescription = 'altered';
                return updateTestDoc(testDocument);
            })
            .then(() => {
                NavbarPage.clickNavigateToSettings();
                NavbarPage.clickNavigateToExcavation();
                browser.sleep(delays.shortRest * 10);
                ResourcesPage.getListItemEl('testf' + nr).getText().then(text => {
                    expect(text).toContain('altered');
                    done();
                })
            });
    });

    it('resolve a save conflict via conflict resolver', done => {
        const nr = '5';
        let testDocument;

        return createOneDocument(nr).then(document => {
            testDocument = document;
            ResourcesPage.clickSelectResource('testf' + nr);
            return DocumentViewPage.clickEditDocument();
        }).then(() => {
            testDocument.resource.shortDescription = 'Testfund' + nr + '_alternative1';
            return updateTestDoc(testDocument);
        }).then(() => {
            browser.sleep(delays.shortRest * 10);
            DocumentEditWrapperPage.typeInInputField('Testfund' + nr + '_alternative2', 1);
            DocumentEditWrapperPage.clickSaveDocument();
            DocumentEditWrapperPage.clickChooseRightRevision();
            DocumentEditWrapperPage.clickSolveConflictButton();
            DocumentEditWrapperPage.clickSaveDocument();
            expect(ResourcesPage.getListItemEl('testf' + nr).getAttribute('class'))
                .not.toContain('conflicted');
            done();
        }).catch(err => { fail(err); done(); });
    });

    it('detect an eventual conflict and mark the corresponding resource list item', done => {
        const nr = '7';

        return createOneDocument(nr)
            .then(() => {
                expect(ResourcesPage.getListItemEl('testf' + nr).getAttribute('class')).not.toContain('conflicted');
            })
            .then(() => createAlternateDocument(nr))
            .then(() => {
                expect(ResourcesPage.getListItemEl('testf' + nr).getAttribute('class')).toContain('conflicted');
                done();
            });
    });

    it('open conflict resolver via taskbar', done => {
        const nr = '8';

        createEventualConflict(nr).then(() => {

            NavbarPage.clickConflictsButton();
            NavbarPage.clickConflictResolverLink('testf' + nr);
            browser.wait(EC.visibilityOf(element(by.id('conflict-resolver'))), delays.ECWaitTime).then(done);
        });
    });

    it('open conflict resolver via conflict button in document view', done => {
        const nr = '9';

        createEventualConflict(nr).then(() => {
            ResourcesPage.clickSelectResource('testf' + nr);
            DocumentViewPage.clickSolveConflicts();
            browser.wait(EC.visibilityOf(element(by.id('conflict-resolver'))), delays.ECWaitTime).then(done);
        });
    });

    it('resolve an eventual conflict via conflict resolver', done => {
        const nr = '10';

        createEventualConflict(nr).then(() => {

            ResourcesPage.clickSelectResource('testf' + nr);
            ResourcesPage.clickSelectResource('testf' + nr);
            DocumentViewPage.clickEditDocument();
            DocumentEditWrapperPage.clickConflictsTab();
            DocumentEditWrapperPage.clickChooseRightRevision();
            DocumentEditWrapperPage.clickSolveConflictButton();
            DocumentEditWrapperPage.clickSaveDocument();
            browser.sleep(delays.shortRest * 10);
            expect(ResourcesPage.getListItemEl('testf' + nr).getAttribute('class')).not.toContain('conflicted');

            db.get('tf' + nr).then(doc => {
                expect(['Testfund' + nr, 'Testfund' + nr + '_alternative']).toContain(doc.resource.shortDescription);
                done();
            });

        }).catch(err => {
            console.error('Failure while creating test doc', err);
            fail(); done();
        });
    });

    it('resolve an eventual conflict automatically', done => {
        const nr = '11';

        createEventualConflictForAutoResolving(nr).then(() => {
            browser.sleep(delays.shortRest * 10);
            expect(ResourcesPage.getListItemEl('testf' + nr).getAttribute('class')).not.toContain('conflicted');

            db.get('tf' + nr).then(doc => {
                expect(doc.resource.shortDescription).toEqual('Testfund' + nr);
                expect(doc.resource.weight).toEqual('100');
                expect(doc.resource.height).toEqual('50');
                done();
            });

        }).catch(err => {
            console.error('Failure while creating test doc', err);
            fail(); done();
        });
    });
});
