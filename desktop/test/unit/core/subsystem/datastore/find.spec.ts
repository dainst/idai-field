import { doc } from 'idai-field-core';
import * as PouchDB from 'pouchdb-node';
import { createApp, setupSyncTestDb } from '../subsystem-helper';


describe('subsystem/datastore/find', () => {

    let image0;
    let trench0;
    let datastore;

    function expectErr1(err) {

        if (!err) fail('Wrong Err - undefined');
        if (err.indexOf('Wrong') === -1) fail('Wrong Err - ' + err);
    }


    beforeEach(async done => {

        await setupSyncTestDb();

        const { datastore: d } = await createApp();
        datastore = d;

        spyOn(console, 'error');
        done();
    });


    afterEach(async done => {

        await new PouchDB('testdb').destroy();
        done();
    }, 5000);


    it('DocumentDatastore - do not throw and return everything with all categories', async done => {

        image0 = doc('Image','Image','Image','image0');
        trench0 = doc('Trench','Trench','Trench','trench0');

        await datastore.create(image0);
        await datastore.create(trench0);

        try {
            const result = await datastore.find({ categories: ['Trench', 'Image'] });
            expect(result.documents.length).toBe(2);
        } catch (err) {
            fail(err);
        }
        done();
    });


    it('DocumentDatastore - return everything when called without categories', async done => {

        image0 = doc('Image','Image','Image','image0');
        trench0 = doc('Trench','Trench','Trench','trench0');

        await datastore.create(image0);
        await datastore.create(trench0);

        try {
            const result = await datastore.find({});
            expect(result.documents.length).toBe(2);
        } catch (err) {
            fail(err);
        }
        done();
    });


    it('sort mode', async done => {

        const doc1 = doc('sd1', 'A-B-100', 'Find', '1');
        const doc2 = doc('sd2', 'B-100', 'Find', '2');
        const doc3 = doc('sd3', 'C-100', 'Find', '3');

        await datastore.create(doc1, 'u');
        await datastore.create(doc2, 'u');
        await datastore.create(doc3, 'u');

        const { documents: documents1, totalCount: totalCount1 } =
            await datastore.find({ q: 'B-100', sort: { mode: 'default' }});

        expect(documents1.length).toBe(2);
        expect(totalCount1).toBe(2);

        expect(documents1[0].resource.id).toBe('1');
        expect(documents1[1].resource.id).toBe('2');

        const { documents: documents2, totalCount: totalCount2 } =
            await datastore.find({ q: 'B-100', sort: { mode: 'exactMatchFirst' }});

        expect(documents2.length).toBe(2);
        expect(totalCount2).toBe(2);

        expect(documents2[0].resource.id).toBe('2');
        expect(documents2[1].resource.id).toBe('1');
        done();
    });
});
