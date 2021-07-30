import { PouchdbDatastore, IdGenerator } from 'idai-field-core';
import PouchDB from 'pouchdb-node';
import loadConfiguration from './load-configuration';


describe('loadConfiguration()', () => {


    const project = 'testdb_config';


    let pouchdbManager: PouchdbDatastore;
    

    beforeEach(() => {
        pouchdbManager = new PouchdbDatastore((name: string) => new PouchDB(name), new IdGenerator());
        pouchdbManager.createDbForTesting(project);
    });


    afterEach(async (done) => {
        await pouchdbManager.destroyDb(project);
        done();
    });


    xit('loads default config via config reader', async () => {

        const config = await loadConfiguration(pouchdbManager, 'asdflkjhasdflj', ['de', 'en'], 'Testuser');
        
        // expect(config.getLabelForCategory('Trench')).toEqual('Schnitt');
        // this does not exist any longer
        // now one would fetch via `const category = config.getCategory('Trench')` 
        // and then get the label via `const label = (new Labels(() => ['de'])).get(category)`
    });
});
