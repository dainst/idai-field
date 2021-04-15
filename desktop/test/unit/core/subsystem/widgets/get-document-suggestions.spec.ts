import * as PouchDB from 'pouchdb-node';
import * as tsfun from 'tsfun';
import { createApp, setupSyncTestDb } from '../subsystem-helper';
import { getDocumentSuggestions } from '../../../../../src/app/core/widgets/get-document-suggestions';


describe('subsystem/getDocumentSuggestions', () => {

    let datastore;

    const doc = { resource: { id: '1', identifier: 'One', category: 'Feature', relations: {}}, project: undefined }

    beforeEach(async done => {

        await setupSyncTestDb();
        datastore = (await createApp()).datastore;
        done();
    });

    afterEach(done => new PouchDB('testdb').destroy().then(() => { done(); }), 5000);


    it('getImageSuggestions', async done => {

        await datastore.create(doc, 'test')

        const documents  = await getDocumentSuggestions(
            datastore,
            { categories: ['Feature'] }, /* TODO why do we need to specify the category? */
        );
        expect(documents.length).toBe(1);
        done();
    });


    it('exclude documents not owned by the current project', async done => {

        await datastore.create(tsfun.update('project', 'other', doc), 'test')

        const documents = await getDocumentSuggestions(
            datastore,
            { categories: ['Feature'] },
        );
        expect(documents.length).toBe(0);
        done();
    });
});
