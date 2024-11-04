import { IdGenerator, PouchdbDatastore, SampleDataLoaderBase } from 'idai-field-core';
import { useEffect, useState } from 'react';
import PouchDB from 'pouchdb-core'

PouchDB.plugin(require('@neighbourhoodie/pouchdb-asyncstorage-adapter').default)



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
    const db = await datastore.createDb(
      project,
      { _id: 'project', resource: { id: 'project' } },
      project === 'test'
    );
    const result = await db.allDocs({
      include_docs: true,
      attachments: true
    });
    result.rows.forEach(row=>console.log(row))
    console.log(result.rows)
     } catch (error) {
    console.log(error)
    throw error
  }
  
    datastore.setupChangesEmitter();
    if (project === 'test') {
      const loader = new SampleDataLoaderBase('en');
      await loader.go(datastore.getDb(), 'test');
    }
    return datastore;
 
  
};
