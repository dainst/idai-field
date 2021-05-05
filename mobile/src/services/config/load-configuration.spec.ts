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


    afterEach(async () => await pouchdbManager.destroyDb(project));


    it('loads meninx config via config reader', async () => {

        const config = await loadConfiguration(pouchdbManager, 'meninx-project', ['de', 'en'], 'Testuser');

        expect(config.getLabelForCategory('Wall_surface')).toEqual('Wandoberfläche');
    });


    xit('loads default config via config reader', async () => {

        const config = await loadConfiguration(pouchdbManager, 'default', ['de', 'en'], 'Testuser');
        
        expect(config.getLabelForCategory('Trench')).toEqual('Schnitt');
    });

});
