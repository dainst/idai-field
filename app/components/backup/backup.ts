import {Injectable} from '@angular/core';

import * as fs from 'fs';

const PouchDB = require('pouchdb');
const replicationStream = require('pouchdb-replication-stream');
const MemoryStream = require('memorystream');

@Injectable()
/**
 * @author Daniel de Oliveira
 **/
export class Backup {

    constructor() {}


    public async dump(filePath: string, project: string) {

        PouchDB.plugin(replicationStream.plugin);
        PouchDB.adapter('writableStream', replicationStream.adapters.writableStream);

        let dumpedString = '';
        const stream = new MemoryStream();
        stream.on('data', function(chunk: any) {
            dumpedString += chunk.toString();
        });

        const db = new PouchDB(project);

        await db.dump(stream, {attachments:false});
        fs.writeFileSync(filePath, dumpedString
            .replace('\"data\":{}','\"data\":\"\"'));
    }


    public async readDump(filePath: string, project: string) {

        const db2 = new PouchDB(project);
        PouchDB.plugin(require('pouchdb-load'));
        try {
            await db2.load(filePath);
        } catch (e) {
            console.log("err",e)
        }
    }
}