import * as PouchDB from 'pouchdb-node';
import { doc } from '../../../test-helpers';
import { createApp, setupSyncTestDb } from '../subsystem-helper';


describe('subsystem/datastore/access', () => {

    let image0;
    let trench0;
    let documentDatastore;
    let fieldDocumentDatastore;
    let idaiFieldImageDocumentDatastore;

    function expectErr1(err) {

        if (!err) fail('Wrong Err - undefined');
        if (err.indexOf('Wrong') === -1) fail('Wrong Err - ' + err);
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

        spyOn(console, 'error');

        image0 = doc('Image','Image','Image','image0');
        trench0 = doc('Trench','Trench','Trench','trench0');

        await idaiFieldImageDocumentDatastore.create(image0);
        await fieldDocumentDatastore.create(trench0);
        done();
    });


    afterEach(async done => {

        await new PouchDB('testdb').destroy();
        done();
    }, 5000);
    //

    // create

    it('FieldDatastore - throw when creating an image category', async done => {

        try {
            await fieldDocumentDatastore.create(image0);
            fail();
        } catch (expected) {
            expectErr1(expected);
        }
        done();
    });


    it('ImageDatastore - throw when creating a non image category', async done => {

        try {
            await idaiFieldImageDocumentDatastore.create(trench0);
            fail();
        } catch (expected) {
            expectErr1(expected);
        }
        done();
    });


    // update

    it('FieldDatastore - throw when updating an image category', async done => {

        try {
            await fieldDocumentDatastore.update(image0);
            fail();
        } catch (expected) {
            expectErr1(expected);
        }
        done();
    });


    it('ImageDatastore - throw when updating a non image category', async done => {

        try {
            await idaiFieldImageDocumentDatastore.update(trench0);
            fail();
        } catch (expected) {
            expectErr1(expected);
        }
        done();
    });


    // remove

    it('FieldDatastore - throw when deleting an image category', async done => {

        try {
            await fieldDocumentDatastore.remove(image0);
            fail();
        } catch (expected) {
            expectErr1(expected);
        }
        done();
    });


    it('ImageDatastore - throw when deleting a non image category', async done => {

        try {
            await idaiFieldImageDocumentDatastore.remove(trench0);
            fail();
        } catch (expected) {
            expectErr1(expected);
        }
        done();
    });


    // get

    it('FieldDatastore - throw when getting an image category', async done => {

        try {
            await fieldDocumentDatastore.get('image0', { skipCache: true });
            fail();
        } catch (expected) {
            expectErr1(expected);
        }
        done();
    });


    it('ImageDatastore - throw when getting a non image category', async done => {

        try {
            await idaiFieldImageDocumentDatastore.get('trench0', { skipCache: true });
            fail();
        } catch (expected) {
            expectErr1(expected);
        }
        done();
    });
});
