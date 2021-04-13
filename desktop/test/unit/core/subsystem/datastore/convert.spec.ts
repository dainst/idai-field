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
describe('subsystem/datastore/convert', () => { // TODO review, maybe remove

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

    xit('create - unknown category', async done => {

        try {
            await datastore.create(doc('Trench','Trench','Unknown','trench1'))
            fail();
        } catch (err) {
            expect(err[0]).toEqual(ConfigurationErrors.UNKNOWN_CATEGORY_ERROR);
        }
        done();
    });
});
