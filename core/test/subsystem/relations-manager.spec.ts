import {doc1} from '../test-helpers';
import { createCoreApp } from './subsystem-helper';


describe('subsystem/relations-manager', () => {

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
});
