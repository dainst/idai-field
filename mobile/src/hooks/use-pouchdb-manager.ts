import { PouchdbManager } from 'idai-field-core';
import PouchDB from 'pouchdb-react-native';
import React, { SetStateAction, useEffect, useState } from 'react';

const usePouchdbManager = (project: string): PouchdbManager | undefined => {

    const [pouchdbManager, setPouchdbManager] = useState<PouchdbManager>();

    useEffect(() => {
        
        buildPouchDbManager(project, setPouchdbManager);
    }, [project]);

    return pouchdbManager;
};

export default usePouchdbManager;


const buildPouchDbManager = async (
    project: string,
    setPouchdbManager: React.Dispatch<SetStateAction<PouchdbManager | undefined>>
 ) => {

    const manager = new PouchdbManager((name: string) => new PouchDB(name));
    await manager.createDb(project, { _id: 'project', resource: { id: 'project' } }, false);
    setPouchdbManager(manager);
};
