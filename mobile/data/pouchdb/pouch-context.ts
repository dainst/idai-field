/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';

export interface DbStatus {
    status: number;
    message: string;
}

interface Context {
    db: PouchDB.Database | null;
    dbName: string;
    remoteUser: string;
    remotePassword: string;
    status: DbStatus | null;

    getOperations: () => any[] | undefined;
    setupDb: (dbName: string, remoteUser: string, remotePassword: string) => void;
}

const PouchDbContext = React.createContext<Context>({
    db: null,
    dbName: '',
    remoteUser: '',
    remotePassword: '',
    status: null,
    getOperations: () => [],
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setupDb: (dbName: string, remoteUser: string, remotePassword: string) => {}
});

export default PouchDbContext;