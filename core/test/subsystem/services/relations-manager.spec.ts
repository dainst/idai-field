import {flatten} from 'tsfun';
import { Document, FieldDocument, ImageDocument } from '../../../src/model';
import { doc } from '../../test-helpers';
import { CoreApp, createCoreApp, createHelpers } from '../subsystem-helper';


describe('subsystem/relations-manager', () => {

    let app: CoreApp;
    
    let helpers;


    beforeEach(async done => {
        app = await createCoreApp();
        helpers = await createHelpers(app);
        done();
    });


    xit('get - include antescendants', async done => {

        await helpers.createDocuments([
            ['tc1', 'TypeCatalog', ['t1']],
            ['t1', 'Type']
        ]);

        // const results = await app.relationsManager.getAntescendents('t1');
        // const lookup = makeDocumentsLookup(results);
        // expect(lookup['tc1'].resource.id).toBe('tc1');
        // expect(lookup['t1'].resource.id).toBe('t1');
        done();
    });


    xit('getDescendantsCount', async done => {

        const documentsLookup = await helpers.createDocuments([
            ['tc1', 'TypeCatalog', ['t1']],
            ['t1', 'Type'],
            ['tc2', 'TypeCatalog', ['t2']],
            ['t2', 'Type']
        ]);

        // expect(await app.relationsManager.getDescendantsCount(documentsLookup['tc1'], documentsLookup['tc2'])).toBe(2);
        done();
    });


    it('update', async done => {

        let t1 = doc('', 'identifiert1', 'Feature', 't1') as FieldDocument;
        let t2 = doc('', 'identifiert2', 'Feature', 't2') as FieldDocument;
        t1.resource.relations = { isAfter: ['t2'], isRecordedIn: [] };
        t2.resource.relations = { isBefore: ['t1'], isRecordedIn: [] };

        await app.datastore.create(t1);
        t2 = await app.datastore.create(t2) as any;

        const t2old = Document.clone(t2);
        t2.resource.relations['isBefore'] = [];
        t2.resource.identifier = 'identifiert2new';

        await app.relationsManager.update(t2, t2old);
        t1 = await app.datastore.get('t1') as any;
        t2 = await app.datastore.get('t2') as any;

        expect(t2.resource.relations.isBefore).toEqual([]);
        expect(t1.resource.relations.isAfter).toEqual([]);

        expect(t2old.resource.relations.isBefore).toEqual(['t1']);

        done();
    });


    it('skip image deletion', async done => {

        const tc1 = doc('', 'identifiertc1', 'TypeCatalog', 'tc1') as FieldDocument;
        const t1 = doc('', 'identifiert1', 'Type', 't1') as FieldDocument;
        const i1 = doc('', 'identifieri1', 'Image', 'i1') as ImageDocument;
        const i2 = doc('', 'identifieri2', 'Image', 'i2') as ImageDocument;
        i1.resource.relations = { depicts: ['tc1'] };
        i2.resource.relations = { depicts: ['t1'] };
        tc1.resource.relations = { isDepictedIn: ['i1'], isRecordedIn: [] };
        t1.resource.relations = { isDepictedIn: ['i2'], isRecordedIn: [], liesWithin: ['tc1'] };

        await app.datastore.create(tc1);
        await app.datastore.create(t1);
        await app.datastore.create(i1);
        await app.datastore.create(i2);

        expect((await app.datastore.find({})).documents.length).toBe(4);

        await app.relationsManager.remove(tc1, { descendants: true });

        const documents = (await app.datastore.find({})).documents;
        expect(flatten(documents.map(_ => _.resource.relations.depicts))).toEqual([]);
        await helpers.expectDocuments('i1', 'i2');
        done();
    });


    async function createTestResourcesForRemoveTests() {

        const d1 = doc('', 'identifierid1', 'Trench', 'id1') as FieldDocument;
        const d2 = doc('', 'identifierid2', 'Feature', 'id2') as FieldDocument;
        d2.resource.relations['isRecordedIn'] = ['id1'];
        const d3 = doc('', 'identifierid3', 'Find', 'id3') as FieldDocument;
        d3.resource.relations['isRecordedIn'] = ['id1'];
        d3.resource.relations['liesWithin'] = ['id2'];
        const d4 = doc('', 'identifierid4', 'Find', 'id4') as FieldDocument;
        d4.resource.relations['isRecordedIn'] = ['id1'];
        d4.resource.relations['liesWithin'] = ['id3'];
        d4.resource.relations['isDepictedIn'] = ['id5', 'id6'];

        const d5 = doc('', 'identifierid5', 'Image', 'id5');
        d5.resource.relations['depicts'] = ['id4'];
        const d6 = doc('', 'identifierid6', 'Image', 'id6');
        d6.resource.relations['depicts'] = ['id4', 'id7'];

        const d7 = doc('', 'identifierid7', 'Find', 'id7');
        d7.resource.relations['isRecordedIn'] = ['id1'];
        d7.resource.relations['isDepictedIn'] = ['id6'];

        await app.datastore.create(d1);
        await app.datastore.create(d2);
        await app.datastore.create(d3);
        await app.datastore.create(d4);
        await app.datastore.create(d5);
        await app.datastore.create(d6);
        await app.datastore.create(d7);

        return [d1, d2, d3, d4, d5];
    }


    it('remove, beginning with Feature', async done => {

        const [_, d2] = await createTestResourcesForRemoveTests();

        expect((await app.datastore.find({})).totalCount).toBe(7);
        await app.relationsManager.remove(d2, { descendants: true });

        await helpers.expectDocuments('id1', 'id5', 'id6', 'id7');
        done();
    });


    it('remove, beginning with Trench', async done => {

        const [d1, _] = await createTestResourcesForRemoveTests();

        expect((await app.datastore.find({}, { includeResourcesWithoutValidParent: true })).totalCount).toBe(7);
        await app.relationsManager.remove(d1, { descendants: true });

        await helpers.expectDocuments('id5', 'id6');
        done();
    });


    it('remove, beginning with Trench - keep a descendant', async done => {

        const [d1, _, d3] = await createTestResourcesForRemoveTests();

        expect((await app.datastore.find({}, { includeResourcesWithoutValidParent: true })).totalCount).toBe(7);
        await app.relationsManager.remove(d1, { descendants: true, descendantsToKeep: [d3] });

        await helpers.expectDocuments('id3', 'id5', 'id6');
        done();
    });
});
