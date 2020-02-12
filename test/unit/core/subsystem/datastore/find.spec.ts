import {createApp, setupSyncTestDb} from '../subsystem-helper';
import * as PouchDB from 'pouchdb';
import {Static} from '../../../static';


describe('datastore/find', () => {

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
        done();
    });


    afterEach(async done => {

        await new PouchDB('testdb').destroy();
        done();
    }, 5000);


    it('FieldDatastore - throw when find called with image type ', async done => {



        try {
            await _fieldDocumentDatastore.find({types: ['Image']});
            fail();
        } catch (expected) {
            expectErr1(expected);
        }
        done();
    });


    it('ImageDatastore - throw when find called with non image type ', async done => {

        try {
            await _idaiFieldImageDocumentDatastore.find({types: ['Trench']});
            fail();
        } catch (expected) {
            expectErr1(expected);
        }
        done();
    });


    it('DocumentDatastore - do not throw and return everything with all types', async done => {

        image0 = Static.doc('Image','Image','Image','image0');
        trench0 = Static.doc('Trench','Trench','Trench','trench0');

        await _idaiFieldImageDocumentDatastore.create(image0);
        await _fieldDocumentDatastore.create(trench0);

        try {
            const result = await _documentDatastore.find({types: ['Trench', 'Image']});
            expect(result.documents.length).toBe(2);
        } catch (err) {
            fail(err);
        }
        done();
    });


    it('DocumentDatastore - return everything when called without types', async done => {

        image0 = Static.doc('Image','Image','Image','image0');
        trench0 = Static.doc('Trench','Trench','Trench','trench0');

        await _idaiFieldImageDocumentDatastore.create(image0);
        await _fieldDocumentDatastore.create(trench0);

        try {
            const result = await _documentDatastore.find({});
            expect(result.documents.length).toBe(2);
        } catch (err) {
            fail(err);
        }
        done();
    });


    it('ImageDatastore - return only image type documents when called without types', async done => {

        image0 = Static.doc('Image','Image','Image','image0');
        trench0 = Static.doc('Trench','Trench','Trench','trench0');

        await _idaiFieldImageDocumentDatastore.create(image0);
        await _fieldDocumentDatastore.create(trench0);

        try {
            const result = await _idaiFieldImageDocumentDatastore.find({});
            expect(result.documents.length).toBe(1);
            expect(result.documents[0].resource.id).toEqual('image0');
        } catch (expected) {
            fail();
        }
        done();
    });


    it('FieldDatastore - return only non image type documents when called without types', async done => {

        image0 = Static.doc('Image','Image','Image','image0');
        trench0 = Static.doc('Trench','Trench','Trench','trench0');

        await _idaiFieldImageDocumentDatastore.create(image0);
        await _fieldDocumentDatastore.create(trench0);

        try {
            const result = await _fieldDocumentDatastore.find({});
            expect(result.documents.length).toBe(1);
            expect(result.documents[0].resource.id).toEqual('trench0');
        } catch (expected) {
            fail();
        }
        done();
    });
});