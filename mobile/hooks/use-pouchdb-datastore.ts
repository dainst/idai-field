import { IdGenerator, PouchdbDatastore, SampleDataLoaderBase } from 'idai-field-core';
import PouchDB from 'pouchdb-react-native';
import { useEffect, useState } from 'react';

const usePouchDbDatastore = (project: string): PouchdbDatastore | undefined => {
  const [pouchdbDatastore, setpouchdbDatastore] = useState<PouchdbDatastore>();

  useEffect(() => {
    const managerPromise = buildpouchdbDatastore(project).then((manager) => {
      setpouchdbDatastore(manager);
      return manager;
    });
    return () => {
      managerPromise.then((manager) => {
        console.log('close', manager.getDb().name);
        manager.close();
      });
    };
  }, [project]);

  return pouchdbDatastore;
};

export default usePouchDbDatastore;

const buildpouchdbDatastore = async (
  project: string
): Promise<PouchdbDatastore> => {
 
    const datastore = new PouchdbDatastore(
      (name: string) => new PouchDB(name),
      new IdGenerator()
    );
    try {
    await datastore.createDb(
      project,
      { _id: 'project', resource: { id: 'project' } },
      project === 'test'
    );
     } catch (error) {
    console.log(error)
  }
    datastore.setupChangesEmitter();
    if (project === 'test') {
      const loader = new SampleDataLoaderBase('en');
      await loader.go(datastore.getDb(), 'test');
    }
    return datastore;
 
  
};
