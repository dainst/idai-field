import {DocumentEditWrapperPage} from '../widgets/document-edit-wrapper.page';
import * as PouchDB from "pouchdb";

let resourcesPage = require('./resources.page');
let documentViewPage = require('../widgets/document-view.page');

/**
 * @author Sebastian Cuy
 */
xdescribe('resources/syncing', function() {

    let db = new PouchDB('idai-field-documents');
    let testResource =  {
        id: "td1",
        identifier:"test1",
        type: "object",
        shortDescription: "Testobjekt"
    };
    let testDocument:any = { resource: testResource };

    beforeEach(done => {
        resourcesPage.get()
            .then(() => db.post({testResource}))
            .then(result => {
                testDocument._id = result.id;
                testDocument._rev = result.rev;
            })
            .then(() => resourcesPage.refresh())
            .then(done)
            .catch(err => { console.error(err) });
    });

    afterEach(done => {
       db.remove(testDocument).then(done)
           .catch(err => { console.error(err) });
    });

    it('should detect conflict on save', function(done) {
        testDocument.resource.identifier = 'test2';
        resourcesPage.clickSelectResource('test1')
            .then(() => documentViewPage.clickEditDocument())
            .then(() => db.put(testDocument))
            .then(() => DocumentEditWrapperPage.clickSaveDocument())
            .then(() => {
                expect(DocumentEditWrapperPage.getConflictModal().isDisplayed())
                    .toBeTruthy();
            })
            .then(done)
            .catch(err => fail(err));
    });

});