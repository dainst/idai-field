import {flatten} from 'tsfun';
import {FieldDocument, ImageDocument} from 'idai-components-2';
import {createApp, createHelpers, setupSyncTestDb} from '../subsystem-helper';
import {doc} from '../../../test-helpers';
import {makeDocumentsLookup} from '../../../../../src/app/core/import/import/utils';

/**
 * @author Daniel de Oliveira
 */
describe('subsystem/relations-manager',() => {

    let app;
    let helpers;

    beforeEach(async done => {

        await setupSyncTestDb();
        app = await createApp();
        helpers = createHelpers(app);

        spyOn(console, 'error');
        // spyOn(console, 'warn');

        done();
    });


    async function createTestResourcesForRemoveTests() {

        const username = app.settingsProvider.getSettings().username;

        const d1 = doc('id1', 'Trench') as FieldDocument;
        const d2 = doc('id2', 'Feature') as FieldDocument;
        d2.resource.relations['isRecordedIn'] = ['id1'];
        const d3 = doc('id3', 'Find') as FieldDocument;
        d3.resource.relations['isRecordedIn'] = ['id1'];
        d3.resource.relations['liesWithin'] = ['id2'];
        const d4 = doc('id4', 'Find') as FieldDocument;
        d4.resource.relations['isRecordedIn'] = ['id1'];
        d4.resource.relations['liesWithin'] = ['id3'];
        d4.resource.relations['isDepictedIn'] = ['id5', 'id6'];

        const d5 = doc('id5', 'Image');
        d5.resource.relations['depicts'] = ['id4'];
        const d6 = doc('id6', 'Image');
        d6.resource.relations['depicts'] = ['id4', 'id7'];

        const d7 = doc('id7', 'Find');
        d7.resource.relations['isDepictedIn'] = ['d6'];

        await app.documentDatastore.create(d1, username);
        await app.documentDatastore.create(d2, username);
        await app.documentDatastore.create(d3, username);
        await app.documentDatastore.create(d4, username);
        await app.documentDatastore.create(d5, username);
        await app.documentDatastore.create(d6, username);
        await app.documentDatastore.create(d7, username);

        return [d1, d2, d3, d4, d5];
    }


    it('get - only document', async done => {

        await helpers.createDocuments([
            ['tc1', 'TypeCatalog', ['t1']],
            ['t1', 'Type']
        ]);

        const result = await app.relationsManager.get('tc1');
        expect(result.resource.id).toBe('tc1');
        done();
    });


    it('get - include descendants', async done => {

        await helpers.createDocuments([
            ['tc1', 'TypeCatalog', ['t1']],
            ['t1', 'Type']
        ]);

        const results = makeDocumentsLookup(await app.relationsManager.get('tc1', { descendants: true }));
        expect(results['tc1'].resource.id).toBe('tc1');
        expect(results['t1'].resource.id).toBe('t1');
        done();
    });


    it('get - only descendants', async done => {

        await helpers.createDocuments([
            ['tc1', 'TypeCatalog', ['t1']],
            ['t1', 'Type']
        ]);

        const results = await app.relationsManager.get('tc1', { descendants: true, toplevel: false });
        expect(results.length).toBe(1);
        expect(results[0].resource.id).toBe('t1');
        done();
    });


    it('getDescendantsCount', async done => {

        const documentsLookup = await helpers.createDocuments([
            ['tc1', 'TypeCatalog', ['t1']],
            ['t1', 'Type'],
            ['tc2', 'TypeCatalog', ['t2']],
            ['t2', 'Type']
        ]);

        expect(await app.relationsManager.getDescendantsCount(documentsLookup['tc1'], documentsLookup['tc2'])).toBe(2);
        done();
    });


    it('remove, beginning with Feature', async done => {

        const [_, d2] = await createTestResourcesForRemoveTests();

        expect((await app.documentDatastore.find({})).totalCount).toBe(7);
        await app.relationsManager.remove(d2, { descendants: true });

        await helpers.expectDocuments('id1', 'id5', 'id6', 'id7');
        done();
    });


    it('remove, beginning with Trench', async done => {

        const [d1, _] = await createTestResourcesForRemoveTests();

        expect((await app.documentDatastore.find({})).totalCount).toBe(7);
        await app.relationsManager.remove(d1, { descendants: true });

        await helpers.expectDocuments('id5', 'id6', 'id7');
        done();
    });


    it('remove, beginning with Trench - keep a descendant', async done => {

        const [d1, _, d3] = await createTestResourcesForRemoveTests();

        expect((await app.documentDatastore.find({})).totalCount).toBe(7);
        await app.relationsManager.remove(d1, { descendants: true, descendantsToKeep: [d3] });

        await helpers.expectDocuments('id3', 'id5', 'id6', 'id7');
        done();
    });


    // TODO review: this was moved from image-relations-manager
    it('skip image deletion', async done => {

        const tc1 = doc('tc1', 'TypeCatalog') as FieldDocument;
        const t1 = doc('t1', 'Type') as FieldDocument;
        const i1 = doc('i1', 'Image') as ImageDocument;
        const i2 = doc('i2', 'Image') as ImageDocument;
        i1.resource.relations = { depicts: ['tc1'] };
        i2.resource.relations = { depicts: ['t1'] };
        tc1.resource.relations = { isDepictedIn: ['i1'], isRecordedIn: [] };
        t1.resource.relations = { isDepictedIn: ['i2'], isRecordedIn: [], liesWithin: ['tc1'] };

        await app.documentDatastore.create(tc1, 'test');
        await app.documentDatastore.create(t1, 'test');
        await app.documentDatastore.create(i1, 'test');
        await app.documentDatastore.create(i2, 'test');

        expect((await app.documentDatastore.find({})).documents.length).toBe(4);

        await app.relationsManager.remove(tc1, { descendants: true });

        const documents = (await app.documentDatastore.find({})).documents;
        expect(flatten(documents.map(_ => _.resource.relations.depicts))).toEqual([]);
        await helpers.expectDocuments('i1', 'i2');
        done();
    });
});
