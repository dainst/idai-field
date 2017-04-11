import {DocumentEditWrapperPage} from '../widgets/document-edit-wrapper.page';
import {browser} from 'protractor';
import * as PouchDB from 'pouchdb';
import * as cors from 'pouchdb-server/lib/cors'
import * as express from 'express';
const expressPouchDB = require('express-pouchdb');
const fs = require('fs-extra');
const path = require('path');

const resourcesPage = require('./resources.page');
const documentViewPage = require('../widgets/document-view.page');

/**
 * @author Sebastian Cuy
 */
describe('resources/syncing', function() {

    const defaultConf = path.resolve(__dirname, '../../../config/config.json');
    const tempConf = path.resolve(__dirname, './config.json.tmp');
    const syncConf = path.resolve(__dirname, './resources-syncing.config.json');

    let db;
    let testResource =  {
        id: "td1",
        identifier:"test1",
        type: "object",
        shortDescription: "Testobjekt",
        relations: []
    };
    let testDocument:any = { resource: testResource };

    function setupTestDB() {
        return new Promise(resolve => {
            let app = express();
            let pouchDbApp = expressPouchDB(PouchDB);
            app.use(cors(pouchDbApp.couchConfig))
            app.use('/', pouchDbApp);
            app.listen(3000, function () {
                new PouchDB('idai-field-documents').destroy().then(() => {
                    resolve(new PouchDB('idai-field-documents'));
                });
            });
        })
            .then(newDb => db = newDb)
            .then(() => db.post(testDocument))
            .then(result => {
                testDocument._id = result.id;
                testDocument._rev = result.rev;
            });
    }

    function updateTestDoc() {
        testDocument.resource.identifier = 'test2';
        return db.put(testDocument)
            .then(result => {
                testDocument._id = result.id;
                testDocument._rev = result.rev;
            })
            .catch(err => console.log("failure while updating test doc", err));
    }

    beforeAll(() => {
        fs.copySync(defaultConf, tempConf);
        fs.copySync(syncConf, defaultConf);
    });

    afterAll(() => {
        fs.moveSync(tempConf, defaultConf, { overwrite: true });
    });

    beforeEach(done => {
        setupTestDB()
            .then(done)
            .catch(err => { console.error(err) });
    });

    afterEach(done => {
       db.remove(testDocument._id, testDocument._rev).then(done)
           .catch(err => { console.error("Error in afterEach", err) });
    });

    it('should detect conflict on save', function(done) {

        resourcesPage.get()
            .then(() => resourcesPage.typeInIdentifierInSearchField('test1'))
            .then(() => resourcesPage.clickSelectResource('test1'))
            .then(() => documentViewPage.clickEditDocument())
            .then(updateTestDoc)
            .then(() => DocumentEditWrapperPage.clickSaveDocument())
            .then(done)
            .catch(err => fail(err));
    });

});