import { isProjectDocument } from '@idai-field/core';
import { Document } from 'idai-components-2';
import PouchDB from 'pouchdb';
import PouchDBAuthentication from 'pouchdb-authentication';
import PouchDBFind from 'pouchdb-find';


export const setupDB = async (dbName: string): Promise<PouchDB.Database> => {

    PouchDB.plugin(PouchDBFind);
    PouchDB.plugin(PouchDBAuthentication);

    const db = new PouchDB(dbName);

    await db.createIndex({
        index: { fields: ['resource.type'] }
    });

    return db;
};


export const setupReplication = async (db: PouchDB.Database, user: string, password: string): Promise<any> => {

    return new Promise( (resolve, reject) => {

        const remoteDb = new PouchDB(`https://${user}:${password}@field.dainst.org/sync/${db.name}`);

        remoteDb.replicate.to(db)
            .on('complete', () => resolve(db))
            .on('error', (err) => reject(err));

    });
};


export const listOperations = async (db: PouchDB.Database): Promise<any[]> => {

    const result = await db.find({
        selector: {
            '$or': [{ 'resource.type': 'Trench' }, { 'resource.type': 'Survey' }, { 'resource.type': 'Building' }]
        }
    });
    
    return result.docs
        // only for testing
        .filter(doc => !isProjectDocument(doc as Document));
};
