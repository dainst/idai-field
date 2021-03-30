import { doc } from '@idai-field/core';
import * as PouchDB from 'pouchdb-node';
import { ConfigurationErrors } from '../../../../../src/app/core/configuration/boot/configuration-errors';
import { createApp, setupSyncTestDb } from '../subsystem-helper';


/**
 * This test suite focuses on the differences between the datastores.
 *
 * Depending on the Category Class T and based on document.resource.category,
 * well-formed documents are about to be created.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('subsystem/datastore/convert', () => {

    let image0;
    let trench0;
    let documentDatastore;
    let fieldDocumentDatastore;
    let idaiFieldImageDocumentDatastore;


    function expectErr(err) {

        if (!err) fail('Wrong Err - undefined');
        if (err.indexOf(ConfigurationErrors.UNKNOWN_CATEGORY_ERROR) === -1) fail('Wrong Err' + err);
    }


    beforeEach(async done => {

        await setupSyncTestDb();

        const {
            documentDatastore: d,
            fieldDocumentDatastore: f,
            imageDatastore: i
        } = await createApp();

        documentDatastore = d;
        fieldDocumentDatastore = f;
        idaiFieldImageDocumentDatastore = i;

        image0 = doc('Image','Image','Image','image0');
        trench0 = doc('Trench','Trench','Trench','trench0');

        image0 = await idaiFieldImageDocumentDatastore.create(image0);
        trench0 = await fieldDocumentDatastore.create(trench0);
        done();
    });


    afterEach(async done => {

        await new PouchDB('testdb').destroy();
        done();
    }, 5000);


    // create

    it('FieldDatastore - add relations with create', async done => {

        try {
            expect((await idaiFieldImageDocumentDatastore.
            create(doc('Image','Image','Image','image1'))).
                resource.relations.depicts).toEqual([]);
        } catch (err) {
            fail(err);
        }
        done();
    });


    it('FieldDatastore - add relations with create', async done => {

        try {
            expect((await fieldDocumentDatastore.
            create(doc('Trench','Trench','Trench','trench1'))).
                resource.relations.isRecordedIn).toEqual([]);
        } catch (err) {
            fail(err);
        }
        done();
    });


    it('create - unknown category', async done => {

        try {
            expect((await fieldDocumentDatastore.
            create(doc('Trench','Trench','Unknown','trench1'))).
                resource.relations.isRecordedIn).toEqual([]);
            fail();
        } catch (err) {
            expectErr(err);
        }
        done();
    });


    // update

    it('ImageDatastore - add relations with update', async done => {

        delete image0.resource.relations.depicts;
        expect((await idaiFieldImageDocumentDatastore.update(image0)).resource.relations.depicts).toEqual([]);
        done();
    });


    it('FieldDatastore - add relations with update', async done => {

        delete trench0.resource.relations.isRecordedIn;
        expect((await fieldDocumentDatastore.
        update(trench0)).resource.relations.isRecordedIn).toEqual([]);
        done();
    });


    // get

    it('get - add relations for FieldDocument', async done => {

        expect((await fieldDocumentDatastore.get('trench0', { skipCache: true })).
            resource.relations.isRecordedIn).toEqual([]);
        expect((await fieldDocumentDatastore.get('trench0', { skipCache: false })).
            resource.relations.isRecordedIn).toEqual([]);
        expect((await documentDatastore.get('trench0', { skipCache: true })).
            resource.relations.isRecordedIn).toEqual([]);
        expect((await documentDatastore.get('trench0', { skipCache: false })).
            resource.relations.isRecordedIn).toEqual([]);
        done();
    });


    it('get - add relations for ImageDocument', async done => {

        expect((await idaiFieldImageDocumentDatastore.get('image0', { skipCache: true })).
            resource.relations.depicts).toEqual([]);
        expect((await idaiFieldImageDocumentDatastore.get('image0', { skipCache: false })).
            resource.relations.depicts).toEqual([]);
        expect((await documentDatastore.get('image0', { skipCache: true })).
            resource.relations.depicts).toEqual([]);
        expect((await documentDatastore.get('image0', { skipCache: false })).
            resource.relations.depicts).toEqual([]);
        done();
    });


    // find

    it('find - add relations for FieldDocument', async done => {

        expect((await fieldDocumentDatastore.find({})). // result coming from cache
            documents[0].resource.relations.isRecordedIn).toEqual([]);
        expect((await idaiFieldImageDocumentDatastore.find({})). // result coming from cache
            documents[0].resource.relations.depicts).toEqual([]);
        done();
    });
});
