import { IdGenerator, PouchdbDatastore } from 'idai-field-core';
import PouchDB from 'pouchdb-node';
import loadConfiguration from './load-configuration';

describe('loadConfiguration()', () => {
  const project = 'testdb_config';

  let pouchdbDatastore: PouchdbDatastore;

  beforeEach(() => {
    pouchdbDatastore = new PouchdbDatastore(
      (name: string) => new PouchDB(name),
      new IdGenerator()
    );
    pouchdbDatastore.createDbForTesting(project);
  });

  afterEach(async (done) => {
    await pouchdbDatastore.destroyDb(project);
    done();
  });

  xit('loads default config via config reader', async () => {
    const config = await loadConfiguration(
      pouchdbDatastore,
      'asdflkjhasdflj',
      ['de', 'en'],
      'Testuser'
    );

    // expect(config.getLabelForCategory('Trench')).toEqual('Schnitt');
    // this does not exist any longer
    // now one would fetch via `const category = config.getCategory('Trench')`
    // and then get the label via `const label = (new Labels(() => ['de'])).get(category)`
  });
});
