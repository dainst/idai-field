import { doc1 } from '../test-helpers';
import { CoreApp, createCoreApp, createHelpers } from './subsystem-helper';


describe('subsystem/datastore', () => {

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

        await helpers.expectDocuments('abc');
        done();
    });
});
