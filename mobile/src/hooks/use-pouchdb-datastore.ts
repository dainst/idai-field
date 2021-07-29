import { PouchdbDatastore, SampleDataLoaderBase, IdGenerator } from 'idai-field-core';
import PouchDB from 'pouchdb-react-native';
import { useEffect, useState } from 'react';

const usePouchdbManager = (project: string): PouchdbDatastore | undefined => {

    const [pouchdbManager, setPouchdbManager] = useState<PouchdbDatastore>();

    useEffect(() => {
        
        const managerPromise = buildPouchDbManager(project).then(manager => {
            setPouchdbManager(manager);
            return manager;
        });
        return () => {
            managerPromise.then(manager => {
                console.log('close', manager.getDb().name);
                manager.close();
            });
        };
    }, [project]);

    return pouchdbManager;
};

export default usePouchdbManager;


const buildPouchDbManager = async (project: string): Promise<PouchdbDatastore> => {

    const datastore = new PouchdbDatastore((name: string) => new PouchDB(name), new IdGenerator());
    await datastore.createDb(project, { _id: 'project', resource: { id: 'project' } }, project === 'test');
    datastore.setupChangesEmitter();
    if(project === 'test'){
        const loader = new SampleDataLoaderBase('en');
        await loader.go(datastore.getDb(), 'test');
    }
    return datastore;
};
