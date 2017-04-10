import {DocumentEditWrapperPage} from '../widgets/document-edit-wrapper.page';
import {browser} from 'protractor';
import * as PouchDB from 'pouchdb';
import * as cors from 'pouchdb-server/lib/cors'
import * as express from 'express';
let expressPouchDB = require('express-pouchdb');

let resourcesPage = require('./resources.page');
let documentViewPage = require('../widgets/document-view.page');
import {NavbarPage} from '../navbar.page';

/**
 * @author Sebastian Cuy
 */
xdescribe('resources/syncing', function() {

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
                    console.log("PouchDB Server listening on port 3000");
                    resolve(new PouchDB('idai-field-documents'));
                });
            });
        })
            .then(newDb => db = newDb)
            .then(() => db.post(testDocument))
            .then(result => {
                console.log("saved test doc", result);
                testDocument._id = result.id;
                testDocument._rev = result.rev;
            });
    }

    function updateTestDoc() {
        testDocument.resource.identifier = 'test2';
        return db.put(testDocument)
            .then(result => {
                console.log("updated test doc", result);
                testDocument._id = result.id;
                testDocument._rev = result.rev;
            })
            .catch(err => console.log("failure while updating test doc", err));
    }

    beforeEach(done => {
        resourcesPage.get()
            .then(setupTestDB)
            .then(done)
            .catch(err => { console.error(err) });
    });

    afterEach(done => {
       db.remove(testDocument._id, testDocument._rev).then(done)
           .catch(err => { console.error("Error in afterEach", err) });
    });

    xit('should detect conflict on save', function(done) {

        browser.waitForAngular();
        resourcesPage.refresh()
            .then(() => resourcesPage.clickSelectResource('test1'))
            .then(() => documentViewPage.clickEditDocument())
            .then(updateTestDoc)
            .then(() => DocumentEditWrapperPage.clickSaveDocument())
            .then(() => console.log("done"))
            .then(done)
            .catch(err => fail(err));
    });

});