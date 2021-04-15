import { Document } from 'idai-field-core';
import React, { useState } from 'react';
import PouchDbContext, { DbStatus } from './pouch-context';
import { setupDB } from './pouchdb-service';

const PouchDbContextProvider: React.FC = (props) => {
    
    const [db, setDb] = useState<PouchDB.Database | null>(null);
    const [dbName, setDbName] = useState<string>('');
    const [remoteUser, setRemoteUser] = useState<string>('');
    const [remotePassword, setRemotePassword] = useState<string>('');
    const [operations, setOperations] = useState<Document[]>([]);
    const [status, setStatus] = useState<DbStatus | null>(null);

    const isDbConnected = () => status?.status === 200;


    const connect = async (dbName: string, remoteUser: string, remotePassword: string): Promise<DbStatus | undefined> =>
    {
        let status;
        await setupDB(dbName, remoteUser, remotePassword)
            .then(db => {
                setDb(db);
                setStatus({ status: 200, message: 'connected' });
                setDbName(dbName);
                setRemoteUser(remoteUser);
                setRemotePassword(remotePassword);
                return db.allDocs( { include_docs: true });
            })
            .then(docs => {
                const filteredDocs = docs.rows.filter(doc => isDocValid(doc));
                setOperations(filteredDocs.map(doc => doc.doc));
                status = { status: 200, message: 'connected' };
            })
            .catch(err => {
                status = { status: err.status, message: err.message };
                setStatus(status);
            });
        return status;
        
    };
    

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
            db, dbName, remoteUser, remotePassword, status, operations, connect, disconnect, isDbConnected } }>
            {props.children}
        </PouchDbContext.Provider>
    );
};

const isDocValid = (doc: any):boolean => {
    
    if( doc.doc.resource.type === 'Trench'||
        doc.doc.resource.type === 'Survey'||
        doc.doc.resource.type === 'Building' ||
        doc.doc.resource.type === 'Room' ||
        doc.doc.resource.type === 'Survey unit')
    return true;
    else return false;
};

export default PouchDbContextProvider;