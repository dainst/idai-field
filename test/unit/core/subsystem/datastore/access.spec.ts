import {createApp, setupSyncTestDb} from '../subsystem-helper';
import * as PouchDB from 'pouchdb';
import {Static} from '../../../static';


describe('datastore/access', () => {

    let image0;
    let trench0;
    let _documentDatastore;
    let _fieldDocumentDatastore;
    let _idaiFieldImageDocumentDatastore;

    function expectErr1(err) {

        if (!err) fail('Wrong Err - undefined');
        if (err.indexOf('Wrong') === -1) fail('Wrong Err - ' + err);
    }


    beforeEach(async done => {

        await setupSyncTestDb();

        const {
            documentDatastore,
            fieldDocumentDatastore,
            imageDatastore
        } = await createApp();

        _documentDatastore = documentDatastore;
        _fieldDocumentDatastore = fieldDocumentDatastore;
        _idaiFieldImageDocumentDatastore = imageDatastore;

        spyOn(console, 'error');

        image0 = Static.doc('Image','Image','Image','image0');
        trench0 = Static.doc('Trench','Trench','Trench','trench0');

        await _idaiFieldImageDocumentDatastore.create(image0);
        await _fieldDocumentDatastore.create(trench0);
        done();
    });


    afterEach(async done => {

        await new PouchDB('testdb').destroy();
        done();
    }, 5000);
    //

    // create

    it('FieldDatastore - throw when creating an image type', async done => {

        try {
            await _fieldDocumentDatastore.create(image0);
            fail();
        } catch (expected) {
            expectErr1(expected);
        }
        done();
    });


    it('ImageDatastore - throw when creating a non image type', async done => {

        try {
            await _idaiFieldImageDocumentDatastore.create(trench0);
            fail();
        } catch (expected) {
            expectErr1(expected);
        }
        done();
    });


    // update

    it('FieldDatastore - throw when updating an image type', async done => {

        try {
            await _fieldDocumentDatastore.update(image0);
            fail();
        } catch (expected) {
            expectErr1(expected);
        }
        done();
    });


    it('ImageDatastore - throw when updating a non image type', async done => {

        try {
            await _idaiFieldImageDocumentDatastore.update(trench0);
            fail();
        } catch (expected) {
            expectErr1(expected);
        }
        done();
    });


    // remove

    it('FieldDatastore - throw when deleting an image type', async done => {

        try {
            await _fieldDocumentDatastore.remove(image0);
            fail();
        } catch (expected) {
            expectErr1(expected);
        }
        done();
    });


    it('ImageDatastore - throw when deleting a non image type', async done => {

        try {
            await _idaiFieldImageDocumentDatastore.remove(trench0);
            fail();
        } catch (expected) {
            expectErr1(expected);
        }
        done();
    });


    // get

    it('FieldDatastore - throw when getting an image type', async done => {

        try {
            await _fieldDocumentDatastore.get('image0', { skipCache: true });
            fail();
        } catch (expected) {
            expectErr1(expected);
        }
        done();
    });


    it('ImageDatastore - throw when getting a non image type', async done => {

        try {
            await _idaiFieldImageDocumentDatastore.get('trench0', { skipCache: true });
            fail();
        } catch (expected) {
            expectErr1(expected);
        }
        done();
    });
});