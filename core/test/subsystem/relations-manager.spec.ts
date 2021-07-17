import {FieldDocument} from '../../src/model/field-document';
import { createDocuments, doc1 } from '../test-helpers';
import { CoreApp, createCoreApp, createHelpers } from './subsystem-helper';


describe('subsystem/relations-manager', () => {

    const user = 'testuser';
    let app: CoreApp;
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

        await helpers.expectDocuments('idp1', 'idp2', 'id1', 'id2', 'id3');
        done();
    });
});
