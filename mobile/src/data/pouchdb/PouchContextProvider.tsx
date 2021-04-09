import React, { useEffect, useState } from 'react';
import PouchDbContext, { DbStatus } from './pouch-context';
import { setupDB } from './pouchdb-service';

const PouchDbContextProvider: React.FC = (props) => {
    
    const [db, setDb] = useState<PouchDB.Database | null>(null);
    const [dbName, setDbName] = useState<string>('');
    const [remoteUser, setRemoteUser] = useState<string>('');
    const [remotePassword, setRemotePassword] = useState<string>('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [_operations, setOperations] = useState<Document[]>();
    const [status, setStatus] = useState<DbStatus | null>(null);

    const setupDb = (dbName: string, remoteUser: string, remotePassword: string) => {
        setDbName(dbName);
        setRemoteUser(remoteUser);
        setRemotePassword(remotePassword);
    };
    
    useEffect(() => {
        
        if(remoteUser && remotePassword){
            setupDB(dbName, remoteUser, remotePassword)
                .then((db) => {
                    setDb(db);
                    setStatus({ status: 200, message:'connected' });
                    return db.allDocs({ include_docs: true });
                })
                .then(docs => {
                    const filteredDocs = docs.rows.filter(doc => isDocValid(doc));
                    setOperations(filteredDocs.map(doc => doc.doc));

                })
                .catch(err => {
                    setStatus({ status: err.status, message: err.message });
                });
        }
      }, [dbName, remotePassword, remoteUser]);

    const getOperations = () => _operations;
    const disconnect = () => {
        setDb(null);
        setStatus(null);
        setDbName('');
        setRemoteUser('');
        setRemotePassword('');
        setOperations([]);
    };

    return (
        <PouchDbContext.Provider value={ {
            db, dbName, remoteUser, remotePassword, status, getOperations, setupDb, disconnect } }>
            {props.children}
        </PouchDbContext.Provider>
    );
};

const isDocValid = (doc: any):boolean => {
    
    if( doc.doc.resource.type === 'Trench'||
        doc.doc.resource.type === 'Survey'||
        doc.doc.resource.type === 'Building')
    return true;
    else return false;
};

export default PouchDbContextProvider;