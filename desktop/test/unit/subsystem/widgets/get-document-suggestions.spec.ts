import { update } from 'tsfun';
import { getDocumentSuggestions } from '../../../../src/app/components/widgets/get-document-suggestions';
import { cleanUp, createApp } from '../subsystem-helper';


describe('subsystem/getDocumentSuggestions', () => {

    let datastore;

    const trenchDocument = {
        resource: {
            id: '1',
            identifier: 'One',
            category: 'Trench',
            relations: {}
        },
        project: undefined
    };

    const featureDocument = {
        resource: {
            id: '2',
            identifier: 'Two',
            category: 'Feature',
            relations: { isRecordedIn: ['1'] }
        }, project: undefined
    };


    beforeEach(async () => {
        
        datastore = (await createApp()).datastore;
    });


    afterEach(async () => {
        
        await cleanUp();
    });


    test('get document suggestions', async () => {

        await datastore.create(trenchDocument, 'test');
        await datastore.create(featureDocument, 'test');

        const documents = await getDocumentSuggestions(
            datastore,
            { categories: ['Feature'] },
            false
        );
        expect(documents.length).toBe(1);
    });


    test('exclude documents not owned by the current project', async () => {

        await datastore.create(trenchDocument, 'test');
        await datastore.create(update('project', 'other', featureDocument), 'test');

        const documents = await getDocumentSuggestions(
            datastore,
            { categories: ['Feature'] },
            false
        );
        expect(documents.length).toBe(0);
    });


    test('get document suggestions for documents without valid parent', async () => {

        await datastore.create(featureDocument, 'test');

        const documents = await getDocumentSuggestions(
            datastore,
            { categories: ['Feature'] },
            true
        );
        expect(documents.length).toBe(1);
    });
});
