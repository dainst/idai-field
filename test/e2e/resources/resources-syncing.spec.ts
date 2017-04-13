import {DocumentEditWrapperPage} from '../widgets/document-edit-wrapper.page';
import * as PouchDB from 'pouchdb';
PouchDB.plugin(require('pouchdb-adapter-memory'));
const cors = require('pouchdb-server/lib/cors');
const express = require('express');
const expressPouchDB = require('express-pouchdb');
const fs = require('fs-extra');
const path = require('path');

const resourcesPage = require('./resources.page');
const documentViewPage = require('../widgets/document-view.page');

/**
 * @author Sebastian Cuy
 */
describe('resources/syncing tests --', function() {

    const defaultConf = path.resolve(__dirname, '../../../config/config.json');
    const tempConf = path.resolve(__dirname, './config.json.tmp');
    const syncConf = path.resolve(__dirname, './resources-syncing.config.json');

    let db, server;
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
            server = app.listen(3001, function () {
                new PouchDB('idai-field-documents-test', { adapter: 'memory' })
                    .destroy().then(() => {
                        resolve(new PouchDB('idai-field-documents-test'));
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
            testDocument._id = result.id;
            testDocument._rev = result.rev;
        }).catch(err => console.log("failure while creating test doc", err));
    }

    function resetTestDoc() {

        let id = testDocument._id;
        let rev = testDocument._rev;
        delete testDocument._id;
        delete testDocument._rev;
        testDocument.resource.identifier = 'test1';
        return db.remove(id, rev)
            .catch(err => console.log("failure while removing test doc", err));
    }

    function updateTestDoc() {

        testDocument.resource.identifier = 'test2';
        return db.put(testDocument).then(result => {
            testDocument._id = result.id;
            testDocument._rev = result.rev;
        }).catch(err => console.log("failure while updating test doc", err));
    }

    beforeAll(done => {

        fs.copySync(defaultConf, tempConf);
        fs.copySync(syncConf, defaultConf);
        setupTestDB().then(done);
    });

    afterAll(done => {

        fs.moveSync(tempConf, defaultConf, { overwrite: true });
        tearDownTestDB().then(done);
    });

    beforeEach(done => {

        createTestDoc().then(done);
    });

    afterEach(done => {

        resetTestDoc().then(done);
    });

    it('should show resource created in other db', () => {

        resourcesPage.get();
        resourcesPage.typeInIdentifierInSearchField('test1');
        expect(resourcesPage.getListItemIdentifierText(0)).toBe('test1');
    });

    it('should show changes made in other db', done => {

        resourcesPage.get()
            .then(updateTestDoc)
            .then(() => resourcesPage.typeInIdentifierInSearchField('test2'))
            .then(() => expect(resourcesPage.getListItemIdentifierText(0)).toBe('test2'))
            .then(done);
    });

    xit('resource created in client should be synced to other db', done => {

        resourcesPage.get();
        db.changes({ since: 'now', live: true, include_docs: true }).on('change', change => {
            if (change.doc.resource && change.doc.resource.identifier == 'test3')
                done();
        });
        resourcesPage.performCreateResource('test3');
    });

    it('should detect conflict on save', done => {

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