import {browser,protractor,element,by} from 'protractor';
let EC = protractor.ExpectedConditions;
let delays = require('../config/delays');
import {DocumentEditWrapperPage} from '../widgets/document-edit-wrapper.page';
import {NavbarPage} from '../navbar.page';
import * as PouchDB from 'pouchdb';
PouchDB.plugin(require('pouchdb-adapter-memory'));
const cors = require('pouchdb-server/lib/cors');
const express = require('express');
const expressPouchDB = require('express-pouchdb');
const fs = require('fs-extra');
const path = require('path');

const resourcesPage = require('./resources.page');
const documentViewPage = require('../widgets/document-view.page');
const settingsPage = require('../settings.page');

/**
 * @author Sebastian Cuy
 */
fdescribe('resources/syncing tests --', function() {

    const remoteSiteAddress = 'http://localhost:3001/idai-field-documents-test';

    let db, server;
    let testResource = {
        id: "td1",
        identifier:"test1",
        type: "object",
        shortDescription: "Testobjekt",
        relations: []
    };
    let testDocument: any = { resource: testResource };

    function setupTestDB() {

        return new Promise(resolve => {
            let app = express();
            let pouchDbApp = expressPouchDB(PouchDB);
            app.use(cors(pouchDbApp.couchConfig));
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
        browser.sleep(2000);
        setupTestDB().then(done);
    });

    afterAll(done => {

        tearDownTestDB().then(done);
    });

    beforeEach(done => {

        settingsPage.get();
        settingsPage.clickAddRemoteSiteButton();
        settingsPage.typeInRemoteSiteAddress(remoteSiteAddress);
        settingsPage.clickSaveSettingsButton();

        createTestDoc().then(done);
    });

    afterEach(done => {

        resetTestDoc().then(done);
    });


    function waitForIt(searchTerm,successCB) {
        return browser.sleep(1000).then(()=>
            resourcesPage.typeInIdentifierInSearchField(searchTerm)
        ).then(()=>{
            return browser.wait(EC.visibilityOf(element(by.css('#objectList .list-group-item:nth-child(1) .identifier'))), 500).then(
                ()=>{
                    return successCB();
                },
                ()=>{
                    return waitForIt(searchTerm,successCB)
                })
        });
    }

    it('should show resource created in other db', () => {

        NavbarPage.clickNavigateToResources();
        waitForIt('test1',()=>{
            expect(resourcesPage.getListItemIdentifierText(0)).toBe('test1');
        });

    }, 30000);

    it('should show changes made in other db', () => {

        NavbarPage.clickNavigateToResources()
            .then(updateTestDoc)
            .then(() => waitForIt('test2',()=>expect(resourcesPage.getListItemIdentifierText(0)).toBe('test2')));

    }, 30000);

    it('resource created in client should be synced to other db', done => {

        NavbarPage.clickNavigateToResources();
        db.changes({ since: 'now', live: true, include_docs: true }).on('change', change => {
            if (change.doc.resource && change.doc.resource.identifier == 'test3')
                done();
        });
        resourcesPage.performCreateResource('test3');
    }, 100000);

    it('should detect conflict on save', done => {

        NavbarPage.clickNavigateToResources()
            .then(() => resourcesPage.typeInIdentifierInSearchField('test1'))
            .then(() => resourcesPage.clickSelectResource('test1'))
            .then(() => documentViewPage.clickEditDocument())
            .then(updateTestDoc)
            .then(() => DocumentEditWrapperPage.clickSaveDocument())
            .then(done)
            .catch(err => { fail(err); done(); });
    });

});