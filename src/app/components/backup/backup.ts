import {assoc} from 'tsfun/associative';
import {Name} from '../../core/constants';

let PouchDB;
if (typeof window !== 'undefined') {
    PouchDB = window.require('pouchdb-browser');
    PouchDB.plugin(require('pouchdb-adapter-idb'));
} else {
    PouchDB = require('pouchdb-node');
}

const replicationStream = typeof window !== 'undefined' ? window.require('pouchdb-replication-stream') : require('pouchdb-replication-stream');
const stream = typeof window !== 'undefined' ? window.require('stream') : require('stream');
const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');


/**
 * @author Daniel de Oliveira
 */
export module Backup {

    export const FILE_NOT_EXIST = 'filenotexist';

    export async function dump(filePath: string, project: Name) {

        PouchDB.plugin(replicationStream.plugin);
        PouchDB.adapter('writableStream', replicationStream.adapters.writableStream);

        let dumpedString = '';
        const memoryStream = new stream.Writable();
        memoryStream._write = (chunk: any, encoding: any, done: any) => {
            dumpedString += chunk.toString()
                .replace(/"data"[\s\S]+?,/g,'\"data\":\"\",');

            // note that this regex is a too general
            // we want to get rid of this asap anyway, as soon as the thumbnail thing is fixed in
            // pouchdb-replication stream (see #8404 in redmine)

            done();
        };

        const db = new PouchDB(project);

        await db.dump(memoryStream, { attachments: false });
        fs.writeFileSync(filePath, dumpedString);
    }


    export async function readDump(filePath: string, project: Name) {

        if (!fs.existsSync(filePath)) throw FILE_NOT_EXIST;
        if (!fs.lstatSync(filePath).isFile()) throw FILE_NOT_EXIST;

        const db = new PouchDB(project);
        await db.destroy(); // to prevent pouchdb-load's incremental loading and force a true overwrite of the old db

        const db2 = new PouchDB(project);
        PouchDB.plugin(require('pouchdb-load'));

        await db2.load(filePath);

        const setIdentifier = assoc('resource.identifier', project);
        const projectDocument = await db2.get('project');
        await db2.put(setIdentifier(projectDocument), { force: true });
    }
}
