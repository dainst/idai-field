import * as fs from 'fs';
import { Name } from 'idai-field-core';
import { ProjectIdentifierValidation } from '../../model/project-identifier-validation';
import { SettingsService } from '../../services/settings/settings-service';
import { M } from '../messages/m';

const replicationStream = typeof window !== 'undefined' ? window.require('pouchdb-replication-stream') : require('pouchdb-replication-stream');
const stream = typeof window !== 'undefined' ? window.require('stream') : require('stream');
const PouchDB = typeof window !== 'undefined' ? window.require('pouchdb-browser') : require('pouchdb-node');


/**
 * @author Daniel de Oliveira
 */
export module Backup {

    export const FILE_NOT_EXIST = 'filenotexist';

    export async function dump(filePath: string, project: Name) {

        PouchDB.plugin(replicationStream.plugin);
        (PouchDB as any).adapter('writableStream', replicationStream.adapters.writableStream);

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

        const db: any = new PouchDB(project);

        await db.dump(memoryStream, { attachments: false });
        fs.writeFileSync(filePath, dumpedString);
    }


    /**
     * Returns warnings as array of msgWithParams
     */
    export async function readDump(filePath: string, project: Name,
                                   settingsService: SettingsService): Promise<string[][]> {

        if (!fs.existsSync(filePath)) throw FILE_NOT_EXIST;
        if (!fs.lstatSync(filePath).isFile()) throw FILE_NOT_EXIST;

        const warnings: string[][] = [];

        const db = new PouchDB(project);
        await db.destroy(); // to prevent pouchdb-load's incremental loading and force a true overwrite of the old db

        const db2: any = new PouchDB(project);
        PouchDB.plugin(require('pouchdb-load'));

        await db2.load('file://' + filePath);

        const projectDocument = await db2.get('project');

        if (!ProjectIdentifierValidation.isSimilar(projectDocument.resource.identifier, project)) {
            warnings.push([M.BACKUP_READ_WARNING_UNSIMILAR_PROJECT_IDENTIFIER]);
        }

        projectDocument.resource.identifier = project;
        await db2.put(projectDocument, { force: true });

        await settingsService.updateProjectName(projectDocument);

        return warnings;
    }
}
