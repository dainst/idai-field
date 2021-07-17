import {FieldDocument} from '../../src/model/field-document';
import { createDocuments, doc1 } from '../test-helpers';
import { createCoreApp, createHelpers, makeDocumentsLookup } from './subsystem-helper';


describe('subsystem/relations-manager', () => {

    const user = 'testuser';
    let app;
    let helpers;

    beforeEach(async done => {
        app = await createCoreApp();
        helpers = await createHelpers(app);
        done();
    });


    it('hi', async done => {

        await app.datastore.create(doc1('abc', 'Abc', 'Trench'), user);

        const result = await app.relationsManager.get('abc');
        expect(result.resource.id).toBe('abc');
        done();
    });


    // TODO implement top level filtering
    // TODO impelment get multiple places
    // TODO implement, or review idsToSubtract
    it('get - place, trench, freature, find', async done => {

        const p1 = doc1('idp1', 'identifieridp1', 'Place') as FieldDocument;
        const p2 = doc1('idp2', 'identifieridp2', 'Place') as FieldDocument;

        p2.resource.relations['liesWithin'] = ['idp1'];
        
        const docs = createDocuments([
            ['id1', 'Trench', ['id2']],
            ['id2', 'Feature', ['id3']],
            ['id3', 'Find', []],
        ]);
        docs['id1'].resource.relations['liesWithin'] = ['idp2'];

        // TODO review createDocuments and helpers.createDocuments
        docs['id2'].resource.relations['isRecordedIn'] = ['id1'];
        docs['id3'].resource.relations['isRecordedIn'] = ['id1'];
        
        await helpers.createDocuments(docs);

        await app.datastore.create(p1, user);
        await app.datastore.create(p2, user);

        const results = makeDocumentsLookup(await app.relationsManager.get('idp1', { descendants: true }));
        expect(results['idp1'].resource.id).toBe('idp1');
        expect(results['idp2'].resource.id).toBe('idp2');
        expect(results['id1'].resource.id).toBe('id1');
        expect(results['id2'].resource.id).toBe('id2');
        expect(results['id3'].resource.id).toBe('id3');
        done();
    });
});
