import * as fs from 'fs';

const PouchDB = require('pouchdb');
const replicationStream = require('pouchdb-replication-stream');
const MemoryStream = require('memorystream');


/**
 * @author Daniel de Oliveira
 **/
export module Backup {

    export const FILE_NOT_EXIST = 'filenotexist';

    export async function dump(filePath: string, project: string) {

        PouchDB.plugin(replicationStream.plugin);
        PouchDB.adapter('writableStream', replicationStream.adapters.writableStream);

        let dumpedString = '';
        const stream = new MemoryStream();
        stream.on('data', (chunk: any) => {

            dumpedString +=
                chunk.toString()
                    .replace(/"data"[\s\S]+?,/g,'\"data\":\"\",')
        }); // TODO note that this regex is a too general. we want to get rid of this asap anyway, as soon as the thumbnail thing is fixed in pouchdb-replication stream.

        const db = new PouchDB(project);

        await db.dump(stream, {attachments:false});
        fs.writeFileSync(filePath, dumpedString);
    }


    export async function readDump(filePath: string, project: string) {

        if (!fs.existsSync(filePath)) throw FILE_NOT_EXIST;
        if (!fs.lstatSync(filePath).isFile()) throw FILE_NOT_EXIST;

        const db2 = new PouchDB(project);
        PouchDB.plugin(require('pouchdb-load'));
        try {
            await db2.load(filePath);
        } catch (e) {
            console.log("err",e)
        }
    }
}