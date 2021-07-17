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

        await helpers.createDocuments([
            ['idp1', 'Place', ['idp2']],
            ['idp2', 'Place', ['id1']],
            ['id1', 'Trench', ['id2']],
            ['id2', 'Feature', ['id3']],
            ['id3', 'Find', []],
        ]);

        await helpers.expectDocuments('idp1', 'idp2', 'id1', 'id2', 'id3');

        // TODO app.relationsManager.get('idp1', { }) with descendants
        done();
    });
});
