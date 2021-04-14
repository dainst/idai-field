import * as PouchDB from 'pouchdb-node';
import { update } from 'tsfun';
import { Document } from 'idai-field-core';
import { createApp, setupSyncTestDb } from '../../subsystem-helper';
import { getImageSuggestions } from '../../../../../../src/app/core/docedit/widgets/get-image-suggestions';


describe('subsystem/getImageSuggestions', () => {

    let datastore;

    const doc = { resource: { id: '1', identifier: 'One', category: 'Image', relations: {}}, project: undefined }

    beforeEach(async done => {

        await setupSyncTestDb();
        datastore = (await createApp()).datastore;
        done();
    });

    afterEach(done => new PouchDB('testdb').destroy().then(() => { done(); }), 5000);


    it('getImageSuggestions', async done => {

        await datastore.create(doc, 'test')

        const [,[[image], totalCount]] = await getImageSuggestions(
            datastore,
            { resource: {} } as Document,
            'depicts',
            {
                q: '',
                categories: ['Image'],
                offset: 0,
                limit: 1
            }
        );
        expect(image.resource.id).toBe('1');
        expect(totalCount).toBe(1);
        done();
    });


    it('exclude an already linked image from suggestions', async done => {

        await datastore.create(update(['resource', 'relations', 'depicts'], ['2'], doc), 'test')

        const [,[images, totalCount]] = await getImageSuggestions(
            datastore,
            { resource: { id: '2' } } as Document,
            'depicts',
            {
                q: '',
                categories: ['Image'],
                offset: 0,
                limit: 1
            }
        );
        expect(images.length).toBe(0);
        expect(totalCount).toBe(0);
        done();
    });


    it('exclude documents from other projects', async done => {

        await datastore.create(update('project', 'other', doc), 'test')

        const [,[images, totalCount]] = await getImageSuggestions(
            datastore,
            { resource: {} } as Document,
            'depicts',
            {
                q: '',
                categories: ['Image'],
                offset: 0,
                limit: 1
            }
        );
        expect(images.length).toBe(0);
        expect(totalCount).toBe(0);
        done();
    });
});
