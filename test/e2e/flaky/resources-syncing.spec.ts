import {browser, protractor, element, by} from 'protractor';
import * as PouchDB from 'pouchdb';
import {ResourcesPage} from '../resources/resources.page';
import {DocumentViewPage} from '../widgets/document-view.page';
import {DoceditPage} from '../docedit/docedit.page';
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
xdescribe('resources/syncing --', function() {

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
                'type': 'Object'
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
            DoceditPage.clickSaveDocument();
            expect(ResourcesPage.getListItemEl('testf' + nr).getAttribute('class'))
                .not.toContain('conflicted');
            return DocumentViewPage.getShortDescription();
        }).then(shortDescription => {
            expect(shortDescription).toEqual('Testfund' + nr + '_alternative');
            done();
        }).catch(err => { fail(err); done(); });
    });
});
