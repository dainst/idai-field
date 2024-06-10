import PouchDB =  require('pouchdb-node');
import * as tsfun from 'tsfun';
import { getDocumentSuggestions } from '../../../../src/app/components/widgets/get-document-suggestions';
import { createApp } from '../subsystem-helper';


describe('subsystem/getDocumentSuggestions', () => {

    let datastore;

    const trenchDocument = { resource: { id: '1', identifier: 'One', category: 'Trench', relations: {}},
        project: undefined };
    const featureDocument = { resource: { id: '2', identifier: 'Two', category: 'Feature',
        relations: { isRecordedIn: ['1'] } }, project: undefined };


    beforeEach(async done => {
        
        datastore = (await createApp()).datastore;
        done();
    });


    afterEach(done => new PouchDB('testdb').destroy().then(() => { done(); }), 5000);


    it('get document suggestions', async done => {

        await datastore.create(trenchDocument, 'test');
        await datastore.create(featureDocument, 'test');

        const documents = await getDocumentSuggestions(
            datastore,
            { categories: ['Feature'] },
            false
        );
        expect(documents.length).toBe(1);
        done();
    });


    it('exclude documents not owned by the current project', async done => {

        await datastore.create(trenchDocument, 'test');
        await datastore.create(tsfun.update('project', 'other', featureDocument), 'test');

        const documents = await getDocumentSuggestions(
            datastore,
            { categories: ['Feature'] },
            false
        );
        expect(documents.length).toBe(0);
        done();
    });


    it('get document suggestions for documents without valid parent', async done => {

        await datastore.create(featureDocument, 'test');

        const documents = await getDocumentSuggestions(
            datastore,
            { categories: ['Feature'] },
            true
        );
        expect(documents.length).toBe(1);
        done();
    });
});
