import { doc } from 'idai-field-core';
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
xdescribe('subsystem/datastore/convert', () => {

    let image0;
    let trench0;
    let datastore;

    beforeEach(async done => {

        await setupSyncTestDb();

        const {
            datastore: d,
        } = await createApp();

        datastore = d;

        image0 = doc('Image','Image','Image','image0');
        trench0 = doc('Trench','Trench','Trench','trench0');

        image0 = await datastore.create(image0);
        trench0 = await datastore.create(trench0);
        done();
    });


    afterEach(async done => {
        await new PouchDB('testdb');
        done();
    });


    // create

    it('FieldDatastore - add relations with create', async done => {

        try {
            expect((await datastore.
            create(doc('Image','Image','Image','image1'))).
                resource.relations.depicts).toEqual([]);
        } catch (err) {
            fail(err);
        }
        done();
    });


    it('FieldDatastore - add relations with create', async done => {

        try {
            expect((await datastore.
            create(doc('Trench','Trench','Trench','trench1'))).
                resource.relations.isRecordedIn).toEqual([]);
        } catch (err) {
            fail(err);
        }
        done();
    });


    xit('create - unknown category', async done => {

        try {
            await datastore.create(doc('Trench','Trench','Unknown','trench1'))
            fail();
        } catch (err) {
            expect(err[0]).toEqual(ConfigurationErrors.UNKNOWN_CATEGORY_ERROR);
        }
        done();
    });


    // update

    it('ImageDatastore - add relations with update', async done => {

        delete image0.resource.relations.depicts;
        expect((await datastore.update(image0)).resource.relations.depicts).toEqual([]);
        done();
    });


    it('FieldDatastore - add relations with update', async done => {

        delete trench0.resource.relations.isRecordedIn;
        expect((await datastore.
        update(trench0)).resource.relations.isRecordedIn).toEqual([]);
        done();
    });


    // get

    xit('get - add relations for FieldDocument', async done => {

        expect((await datastore.get('trench0', { skipCache: true })).
            resource.relations.isRecordedIn).toEqual([]);
        expect((await datastore.get('trench0', { skipCache: false })).
            resource.relations.isRecordedIn).toEqual([]);
        expect((await datastore.get('trench0', { skipCache: true })).
            resource.relations.isRecordedIn).toEqual([]);
        expect((await datastore.get('trench0', { skipCache: false })).
            resource.relations.isRecordedIn).toEqual([]);
        done();
    });


    it('get - add relations for ImageDocument', async done => {

        expect((await datastore.get('image0', { skipCache: true })).
            resource.relations.depicts).toEqual([]);
        expect((await datastore.get('image0', { skipCache: false })).
            resource.relations.depicts).toEqual([]);
        expect((await datastore.get('image0', { skipCache: true })).
            resource.relations.depicts).toEqual([]);
        expect((await datastore.get('image0', { skipCache: false })).
            resource.relations.depicts).toEqual([]);
        done();
    });


    // find

    xit('find - add relations for FieldDocument', async done => {

        expect((await datastore.find({})). // result coming from cache
            documents[0].resource.relations.isRecordedIn).toEqual([]);
        expect((await datastore.find({})). // result coming from cache
            documents[0].resource.relations.depicts).toEqual([]);
        done();
    });
});
