import PouchDB from 'pouchdb-react-native';
import PouchDBAuthentication from 'pouchdb-authentication';
import PouchDBFind from 'pouchdb-find';


export const setupDB = async (dbName: string, user: string, password: string): Promise<PouchDB.Database> => {

    PouchDB.plugin(PouchDBFind);
    PouchDB.plugin(PouchDBAuthentication);

    const db = new PouchDB(`https://${user}:${password}@field.dainst.org/sync/${dbName}`);

    return db;
};


