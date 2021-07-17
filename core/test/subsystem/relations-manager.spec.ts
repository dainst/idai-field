import {Document} from '../../src/model/document';
import {FieldDocument} from '../../src/model/field-document';
import {makeLookup} from '../../src/tools/transformers';
import {Lookup} from '../../src/tools/utils';
import { doc1 } from '../test-helpers';
import { createCoreApp } from './subsystem-helper';


describe('subsystem/relations-manager', () => {

    // TODO remove duplication with import/utils.ts
    const makeDocumentsLookup: (ds: Array<Document>) => Lookup<Document> = makeLookup(['resource', 'id']);

    const user = 'testuser';
    let app;

    beforeEach(async done => {
        app = await createCoreApp();
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

        const d1 = doc1('id1', 'identifierid1', 'Trench') as FieldDocument;

        p2.resource.relations['liesWithin'] = ['idp1'];
        d1.resource.relations['liesWithin'] = ['idp2'];

        const d2 = doc1('id2', 'identifierid2', 'Feature') as FieldDocument;
        d2.resource.relations['isRecordedIn'] = ['id1'];
        const d3 = doc1('id3', 'identifierid3', 'Find') as FieldDocument;
        d3.resource.relations['isRecordedIn'] = ['id1'];
        d3.resource.relations['liesWithin'] = ['id2'];

        await app.datastore.create(p1, user);
        await app.datastore.create(p2, user);
        await app.datastore.create(d1, user);
        await app.datastore.create(d2, user);
        await app.datastore.create(d3, user);

        const results = makeDocumentsLookup(await app.relationsManager.get('idp1', { descendants: true }));
        expect(results['idp1'].resource.id).toBe('idp1');
        expect(results['idp2'].resource.id).toBe('idp2');
        expect(results['id1'].resource.id).toBe('id1');
        expect(results['id2'].resource.id).toBe('id2');
        expect(results['id3'].resource.id).toBe('id3');
        done();
    });
});
