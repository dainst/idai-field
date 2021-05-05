import { PouchdbManager } from 'idai-field-core';
import PouchDB from 'pouchdb-node';
import loadConfiguration from './load-configuration';


describe('loadConfiguration()', () => {


    const project = 'testdb_config';


    let pouchdbManager: PouchdbManager;
    

    beforeEach(() => {
        pouchdbManager = new PouchdbManager((name: string) => new PouchDB(name));
        pouchdbManager.createDb_e2e(project);
    });


    afterEach(async (done) => {
        await pouchdbManager.destroyDb(project);
        done();
    });


    it('loads default config via config reader', async () => {

        const config = await loadConfiguration(pouchdbManager, 'asdflkjhasdflj', ['de', 'en'], 'Testuser');
        
        expect(config.getLabelForCategory('Trench')).toEqual('Schnitt');
    });


    it('throw error if custom conf not present', async () => {

        const config = loadConfiguration(pouchdbManager, 'meninx-project', ['de', 'en'], 'Testuser');
        
        await expect(config).rejects.toBeTruthy();
    });

});
