import {to} from 'tsfun';
import {FieldDocument} from 'idai-components-2';
import {createApp, setupSyncTestDb} from '../subsystem-helper';
import {doc} from '../../../test-helpers';
import {FieldDatastore} from '../../../../../src/app/core/datastore/field/field-datastore';
import {PersistenceManager} from '../../../../../src/app/core/model/persistence-manager';

/**
 * @author Daniel de Oliveira
 */
describe('subsystem/persistence-manager',() => {

    let fieldDocumentDatastore: FieldDatastore;
    let persistenceManager: PersistenceManager;


    beforeEach(async done => {

        await setupSyncTestDb();

        const {
            fieldDocumentDatastore: f,
            persistenceManager: p
        } = await createApp();

        fieldDocumentDatastore = f;
        persistenceManager = p;

        spyOn(console, 'error');
        // spyOn(console, 'warn');

        done();
    });


    async function create4TestResourcesForRemoveTests() {

        const d1 = doc('id1', 'Trench') as FieldDocument;
        const d2 = doc('id2', 'Feature') as FieldDocument;
        d2.resource.relations['isRecordedIn'] = ['id1'];
        const d3 = doc('id3', 'Find') as FieldDocument;
        d3.resource.relations['isRecordedIn'] = ['id1'];
        d3.resource.relations['liesWithin'] = ['id2'];
        const d4 = doc('id4', 'Find') as FieldDocument;
        d4.resource.relations['isRecordedIn'] = ['id1'];
        d4.resource.relations['liesWithin'] = ['id3'];

        await fieldDocumentDatastore.create(d1, 'test');
        await fieldDocumentDatastore.create(d2, 'test');
        await fieldDocumentDatastore.create(d3, 'test');
        await fieldDocumentDatastore.create(d4, 'test');

        return [d1, d2];
    }


    it('remove, beginning with Feature', async done => {

        const [_, d2] = await create4TestResourcesForRemoveTests();

       expect((await fieldDocumentDatastore.find({})).totalCount).toBe(4);
       await persistenceManager.remove(d2);
       const result = (await fieldDocumentDatastore.find({})).documents.map(to('resource.id'));
       expect(result).toEqual(['id1']);
       done();
    });


    it('remove, beginning with Trench', async done => {

        const [d1, _] = await create4TestResourcesForRemoveTests();

        expect((await fieldDocumentDatastore.find({})).totalCount).toBe(4);
        await persistenceManager.remove(d1);
        const result = (await fieldDocumentDatastore.find({})).documents.map(to('resource.id'));
        expect(result).toEqual([]);
        done();
    });
});
