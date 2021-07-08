import { PouchdbManager, SampleDataLoaderBase } from 'idai-field-core';
import PouchDB from 'pouchdb-react-native';
import { useEffect, useState } from 'react';

const usePouchdbManager = (project: string): PouchdbManager | undefined => {

    const [pouchdbManager, setPouchdbManager] = useState<PouchdbManager>();

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


const buildPouchDbManager = async (project: string): Promise<PouchdbManager> => {

    const manager = new PouchdbManager((name: string) => new PouchDB(name));
    await manager.createDb(project, { _id: 'project', resource: { id: 'project' } }, project === 'test');
    if(project === 'test'){
        const loader = new SampleDataLoaderBase('en');
        await loader.go(manager.getDb(), 'test');
    }
    return manager;
};
