import {browser, protractor, element, by} from 'protractor';
import * as PouchDB from 'pouchdb';
import {ResourcesPage} from '../resources/resources.page';
import {DoceditPage} from '../docedit/docedit.page';
import {SettingsPage} from '../settings/settings.page';
import {NavbarPage} from '../navbar.page';
import {MenuPage} from '../menu.page';
import {DetailSidebarPage} from '../widgets/detail-sidebar.page';

PouchDB.plugin(require('pouchdb-adapter-memory'));
let EC = protractor.ExpectedConditions;
let delays = require('../config/delays');
const cors = require('pouchdb-server/lib/cors');
const express = require('express');
const expressPouchDB = require('express-pouchdb');
const fs = require('fs');
const common = require('../common');

/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
xdescribe('syncing --', function() {

    const remoteSiteAddress = 'http://localhost:3001';
    const configPath = browser.params.configPath;

    let db, server;


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

        common.resetConfigJson().then(done);
    });


    function createOneDocument(number, additionalFieldName?, additionalFieldValue?) {

        const testDocument = makeDoc('test-' + number, 'testf' + number,
            'Testfund' + number);

        if (additionalFieldName && additionalFieldValue) {
            testDocument.resource[additionalFieldName] = additionalFieldValue;
        }

        return db.put(testDocument).then(result => {
            testDocument['_rev'] = result.rev;
            return browser.sleep(delays.shortRest * 10);
        }).then(() => testDocument);
    }


    function createAlternateDocument(number) {

        const testDocumentAlternative = makeDoc('test-' + number, 'testf' + number,
            'Testfund' + number + '_alternative');
        testDocumentAlternative['_rev'] = '1-dca7c53e7c0e47278b2c09744cc94b21';

        return db.put(testDocumentAlternative, { force: true })
            .then(() => {
                MenuPage.navigateToSettings();
                NavbarPage.clickTab('project');
                ResourcesPage.performJumpToTrenchView('S1');
                return browser.sleep(delays.shortRest * 10);
            });
    }


    function createEventualConflict(number) {

        return createOneDocument(number)
            .then(() => NavbarPage.clickTab('project'))
            .then(() => ResourcesPage.performJumpToTrenchView('S1'))
            .then(() => browser.sleep(delays.shortRest * 10))
            .then(() => createAlternateDocument(number));
    }


    function updateTestDoc(testDocument) {

        return db.put(testDocument).then(result => {
            testDocument._rev = result.rev;
        }).catch(err => console.error('Failure while updating test doc', err));
    }


    it('open conflict resolver via taskbar', async done => {

        const number = '1';

        await createEventualConflict(number);
        await NavbarPage.clickConflictsButton();
        browser.sleep(delays.shortRest * 5);
        NavbarPage.clickConflictResolverLink('testf' + number);
        await browser.wait(EC.visibilityOf(element(by.id('conflict-resolver'))), delays.ECWaitTime);

        done();
    });


    it('open conflict resolver via conflict button in document view', async done => {

        const number = '2';

        await createEventualConflict(number);
        ResourcesPage.clickSelectResource('testf' + number);
        DetailSidebarPage.clickSolveConflicts();
        await browser.wait(EC.visibilityOf(element(by.id('conflict-resolver'))), delays.ECWaitTime);

        done();
    });


    it('resolve a save conflict via conflict resolver', async done => {

        const number = '3';

        let testDocument = await createOneDocument(number);
        await NavbarPage.clickTab('project');
        await ResourcesPage.performJumpToTrenchView('S1');
        await browser.sleep(delays.shortRest * 10);

        ResourcesPage.clickSelectResource('testf' + number);
        await DetailSidebarPage.performEditDocument();
        testDocument.resource.shortDescription = 'Testfund' + number + '_alternative1';
        await updateTestDoc(testDocument);
        DoceditPage.typeInInputField('shortDescription', 'Testfund' + number
            + '_alternative2');
        DoceditPage.clickSaveDocument(true, false);
        DoceditPage.clickChooseRightRevision();
        DoceditPage.clickSolveConflictButton();
        DoceditPage.clickSaveDocument(true, false);
        expect(ResourcesPage.getListItemEl('testf' + number).getAttribute('class'))
            .not.toContain('conflicted');

        done();
    });


    it('resolve an eventual conflict via conflict resolver', done => {

        const number = '4';

        createEventualConflict(number).then(() => {

            ResourcesPage.clickSelectResource('testf' + number);
            ResourcesPage.clickSelectResource('testf' + number);
            DetailSidebarPage.performEditDocument();
            DoceditPage.clickConflictsTab();
            DoceditPage.clickChooseRightRevision();
            DoceditPage.clickSolveConflictButton();
            DoceditPage.clickSaveDocument();
            browser.sleep(delays.shortRest * 10);
            expect(ResourcesPage.getListItemEl('testf' + number).getAttribute('class'))
                .not.toContain('conflicted');

            db.get('test-' + number).then(doc => {
                expect(['Testfund' + number, 'Testfund' + number + '_alternative'])
                    .toContain(doc.resource.shortDescription);
                done();
            });

        }).catch(err => {
            console.error('Failure while creating test doc', err);
            fail(); done();
        });
    });


    it('detect an eventual conflict and mark the corresponding resource list item', async done => {

        const number = '5';

        await createOneDocument(number);
        await NavbarPage.clickTab('project');
        await ResourcesPage.performJumpToTrenchView('S1');
        await browser.sleep(delays.shortRest * 10);

        expect(ResourcesPage.getListItemEl('testf' + number).getAttribute('class'))
            .not.toContain('conflicted');
        await createAlternateDocument(number);
        expect(ResourcesPage.getListItemEl('testf' + number).getAttribute('class'))
            .toContain('conflicted');

        done();
    });
});
