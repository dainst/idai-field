import {browser, protractor, element, by} from 'protractor';
import * as PouchDB from 'pouchdb';
import {ResourcesPage} from '../resources/resources.page';
import {DoceditPage} from '../docedit/docedit.page';
import {SettingsPage} from '../settings/settings.page';
import {NavbarPage} from '../navbar.page';
import {DetailSidebarPage} from '../widgets/detail-sidebar.page';

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
describe('syncing --', function() {

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
                'type': 'Find'
            },
            created: {
                'user': 'testuser',
                'date': '2017-07-24T16:01:10.843Z'
            },
            modified: [{
                'user': 'testuser',
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


    function setConfigJson(): Promise<any> {

        return new Promise(resolve => {
            fs.writeFile(configPath, JSON.stringify({
                isSyncActive: true,
                syncTarget: { address: remoteSiteAddress },
                dbs: ['test']
            }), err => {
                if (err) console.error('Failure while resetting config.json', err);
                resolve();
            });
        });
    }


    beforeAll(done => {

        browser.sleep(delays.shortRest * 10);
        setupTestDB().then(done);
    });


    afterAll(done => tearDownTestDB().then(done));


    beforeEach(done => {

        setConfigJson().then(()=>{
            SettingsPage.get().then(done);
        });
    });


    afterEach(done => {

        if (changes) changes.cancel();
        common.resetConfigJson().then(done);
    });


    function createOneDocument(nr, additionalFieldName?, additionalFieldValue?) {

        const testDocument = makeDoc('tf' + nr, 'testf' + nr, 'Testfund' + nr);

        if (additionalFieldName && additionalFieldValue) {
            testDocument.resource[additionalFieldName] = additionalFieldValue;
        }

        return db.put(testDocument).then(result => {
            testDocument['_rev'] = result.rev;
            return browser.sleep(delays.shortRest * 10);
        }).then(() => testDocument);
    }


    function createAlternateDocument(nr) {

        const testDocumentAlternative = makeDoc('tf' + nr, 'testf' + nr, 'Testfund' + nr + '_alternative');
        testDocumentAlternative['_rev'] = '1-dca7c53e7c0e47278b2c09744cc94b21';

        return db.put(testDocumentAlternative, { force: true })
            .then(() => {
                NavbarPage.performNavigateToSettings();
                NavbarPage.navigate('project');
                ResourcesPage.clickHierarchyButton('S1');
                return browser.sleep(delays.shortRest * 10);
            });
    }


    function createEventualConflict(nr) {

        return createOneDocument(nr)
            .then(() => NavbarPage.navigate('project'))
            .then(() => ResourcesPage.clickHierarchyButton('S1'))
            .then(() => browser.sleep(delays.shortRest * 10))
            .then(() => createAlternateDocument(nr));
    }


    function updateTestDoc(testDocument) {

        return db.put(testDocument).then(result => {
            testDocument._rev = result.rev;
        }).catch(err => console.error('Failure while updating test doc', err));
    }


    it('open conflict resolver via taskbar', async done => {

        const nr = '8';

        await createEventualConflict(nr);
        await NavbarPage.clickConflictsButton();
        browser.sleep(delays.shortRest * 5);
        NavbarPage.clickConflictResolverLink('testf' + nr);
        await browser.wait(EC.visibilityOf(element(by.id('conflict-resolver'))), delays.ECWaitTime);
        done();
    });


    it('open conflict resolver via conflict button in document view', async done => {

        const nr = '9';

        await createEventualConflict(nr);
        ResourcesPage.clickSelectResource('testf' + nr);
        DetailSidebarPage.clickSolveConflicts();
        await browser.wait(EC.visibilityOf(element(by.id('conflict-resolver'))), delays.ECWaitTime);
        done();
    });


    it('resolve a save conflict via conflict resolver', async done => {

        const nr = '6';
        let testDocument = await createOneDocument(nr);
        await NavbarPage.navigate('project');
        await ResourcesPage.clickHierarchyButton('S1');
        await browser.sleep(delays.shortRest * 10);

        ResourcesPage.clickSelectResource('testf' + nr);
        await DetailSidebarPage.performEditDocument();
        testDocument.resource.shortDescription = 'Testfund' + nr + '_alternative1';
        await updateTestDoc(testDocument);
        DoceditPage.typeInInputField('shortDescription', 'Testfund' + nr + '_alternative2');
        DoceditPage.clickSaveDocument(true, false);
        DoceditPage.clickChooseRightRevision();
        DoceditPage.clickSolveConflictButton();
        DoceditPage.clickSaveDocument(true, false);
        expect(ResourcesPage.getListItemEl('testf' + nr).getAttribute('class'))
            .not.toContain('conflicted');

        done();
    });


    it('resolve an eventual conflict via conflict resolver', done => {

        const nr = '10';

        createEventualConflict(nr).then(() => {

            ResourcesPage.clickSelectResource('testf' + nr);
            ResourcesPage.clickSelectResource('testf' + nr);
            DetailSidebarPage.performEditDocument();
            DoceditPage.clickConflictsTab();
            DoceditPage.clickChooseRightRevision();
            DoceditPage.clickSolveConflictButton();
            DoceditPage.clickSaveDocument();
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


    it('detect an eventual conflict and mark the corresponding resource list item', async done => {

        const nr = '7';

        await createOneDocument(nr);
        await NavbarPage.navigate('project');
        await ResourcesPage.clickHierarchyButton('S1');
        await browser.sleep(delays.shortRest * 10);

        expect(ResourcesPage.getListItemEl('testf' + nr).getAttribute('class')).not.toContain('conflicted');
        await createAlternateDocument(nr);
        expect(ResourcesPage.getListItemEl('testf' + nr).getAttribute('class')).toContain('conflicted');
        done();
    });
});
