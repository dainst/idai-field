/* eslint-disable @typescript-eslint/no-empty-function */
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
    operations: Document[] | undefined;

    isDbConnected: () => boolean;
    connect: (dbName: string, remoteUser: string, remotePassword: string) => Promise<DbStatus | undefined>;
    disconnect: () => void;
}

const PouchDbContext = React.createContext<Context>({
    db: null,
    dbName: '',
    remoteUser: '',
    remotePassword: '',
    status: null,
    operations: [],
    isDbConnected: () => false,
    connect: async (dbName: string, remoteUser: string, remotePassword: string) => undefined,
    disconnect: () => {},
});

export default PouchDbContext;