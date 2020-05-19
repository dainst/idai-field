import {createApp, setupSyncTestDb} from '../subsystem-helper';
import * as PouchDB from 'pouchdb-node';
import {Static} from '../../../static';


describe('subsystem/datastore/find', () => {

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
        done();
    });


    afterEach(async done => {

        await new PouchDB('testdb').destroy();
        done();
    }, 5000);


    it('FieldDatastore - throw when find called with image category ', async done => {



        try {
            await fieldDocumentDatastore.find({ categories: ['Image'] });
            fail();
        } catch (expected) {
            expectErr1(expected);
        }
        done();
    });


    it('ImageDatastore - throw when find called with non image category ', async done => {

        try {
            await idaiFieldImageDocumentDatastore.find({ categories: ['Trench'] });
            fail();
        } catch (expected) {
            expectErr1(expected);
        }
        done();
    });


    it('DocumentDatastore - do not throw and return everything with all categories', async done => {

        image0 = Static.doc('Image','Image','Image','image0');
        trench0 = Static.doc('Trench','Trench','Trench','trench0');

        await idaiFieldImageDocumentDatastore.create(image0);
        await fieldDocumentDatastore.create(trench0);

        try {
            const result = await documentDatastore.find({ categories: ['Trench', 'Image'] });
            expect(result.documents.length).toBe(2);
        } catch (err) {
            fail(err);
        }
        done();
    });


    it('DocumentDatastore - return everything when called without categories', async done => {

        image0 = Static.doc('Image','Image','Image','image0');
        trench0 = Static.doc('Trench','Trench','Trench','trench0');

        await idaiFieldImageDocumentDatastore.create(image0);
        await fieldDocumentDatastore.create(trench0);

        try {
            const result = await documentDatastore.find({});
            expect(result.documents.length).toBe(2);
        } catch (err) {
            fail(err);
        }
        done();
    });


    it('ImageDatastore - return only image category documents when called without categories', async done => {

        image0 = Static.doc('Image','Image','Image','image0');
        trench0 = Static.doc('Trench','Trench','Trench','trench0');

        await idaiFieldImageDocumentDatastore.create(image0);
        await fieldDocumentDatastore.create(trench0);

        try {
            const result = await idaiFieldImageDocumentDatastore.find({});
            expect(result.documents.length).toBe(1);
            expect(result.documents[0].resource.id).toEqual('image0');
        } catch (expected) {
            fail();
        }
        done();
    });


    it('FieldDatastore - return only non image category documents when called without categories', async done => {

        image0 = Static.doc('Image','Image','Image','image0');
        trench0 = Static.doc('Trench','Trench','Trench','trench0');

        await idaiFieldImageDocumentDatastore.create(image0);
        await fieldDocumentDatastore.create(trench0);

        try {
            const result = await fieldDocumentDatastore.find({});
            expect(result.documents.length).toBe(1);
            expect(result.documents[0].resource.id).toEqual('trench0');
        } catch (expected) {
            fail();
        }
        done();
    });


    it('sort mode', async done => {

        const doc1 = Static.doc('sd1', 'A-B-100', 'Find', '1');
        const doc2 = Static.doc('sd2', 'B-100', 'Find', '2');
        const doc3 = Static.doc('sd3', 'C-100', 'Find', '3');

        await fieldDocumentDatastore.create(doc1, 'u');
        await fieldDocumentDatastore.create(doc2, 'u');
        await fieldDocumentDatastore.create(doc3, 'u');

        const { documents: documents1, totalCount: totalCount1 } =
            await fieldDocumentDatastore.find({ q: 'B-100', sort: { mode: 'default' }});

        expect(documents1.length).toBe(2);
        expect(totalCount1).toBe(2);

        expect(documents1[0].resource.id).toBe('1');
        expect(documents1[1].resource.id).toBe('2');

        const { documents: documents2, totalCount: totalCount2 } =
            await fieldDocumentDatastore.find({ q: 'B-100', sort: { mode: 'exactMatchFirst' }});

        expect(documents2.length).toBe(2);
        expect(totalCount2).toBe(2);

        expect(documents2[0].resource.id).toBe('2');
        expect(documents2[1].resource.id).toBe('1');
        done();
    });
});
