import { Document } from 'idai-field-core';
import { ProjectIdentifierValidation } from '../../model/project-identifier-validation';
import { SettingsService } from '../settings/settings-service';
import { CREATE_BACKUP, createWorker } from '../create-worker';

const fs = window.require('fs');
const PouchDB = window.require('pouchdb-browser');
const pouchDBLoad = require('pouchdb-load');


export type RestoreBackupError = 'fileNotFound'|'unsimilarProjectIdentifier'|'invalidBackupFormat'|'generic';

export const ERROR_FILE_NOT_FOUND: RestoreBackupError = 'fileNotFound';
export const ERROR_UNSIMILAR_PROJECT_IDENTIFIER: RestoreBackupError = 'unsimilarProjectIdentifier'
export const ERROR_INVALID_BACKUP_FORMAT: RestoreBackupError = 'invalidBackupFormat';
export const ERROR_GENERIC: RestoreBackupError = 'generic';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class BackupService {

    /*
    * @returns true if successful, false if backup creation failed
    */
    public create(targetFilePath: string, project: string): Promise<boolean> {

        return new Promise(resolve => {
            const worker: Worker = createWorker(CREATE_BACKUP);
        
            worker.onmessage = ({ data }) => {
                if (data.error) console.error('Error while trying to create backup file', data.error);
                resolve(data.success);
            }
        
            worker.postMessage({ project, targetFilePath });
        });
    }


    public async restore(filePath: string, project: string, settingsService: SettingsService,
                         checkProjectIdentifier: boolean = true) {

        if (!fs.existsSync(filePath) || !fs.lstatSync(filePath).isFile()) throw [ERROR_FILE_NOT_FOUND];

        if (checkProjectIdentifier) this.assertProjectIdentifierIsValid(filePath, project);

        try {
            const restoredDatabase: any = await this.loadBackupFile(filePath, project);
            const projectDocument: Document = await restoredDatabase.get('project');

            await this.updateProjectIdentifier(projectDocument, project, restoredDatabase);
            await settingsService.updateProjectName(projectDocument);
        } catch (err) {
            console.error('Error while trying to restore backup file', err);
            throw [ERROR_GENERIC];
        }
    }


    private assertProjectIdentifierIsValid(filePath: string, project: string) {

        let projectDocument: Document;
    
        try {
            projectDocument = this.getProjectDocument(filePath);
        } catch(err) {
            console.warn(err);
            throw [ERROR_INVALID_BACKUP_FORMAT];
        }

        if (!ProjectIdentifierValidation.isSimilar(projectDocument.resource.identifier, project)) {
            throw [ERROR_UNSIMILAR_PROJECT_IDENTIFIER, projectDocument.resource.identifier];
        }
    }


    private getProjectDocument(filePath: string): Document {

        const fileContent = fs.readFileSync(filePath, 'utf8');
        return fileContent.split('\n')
            .filter(line => line?.length)
            .map(line => JSON.parse(line)?.docs?.find(document => document.resource.id === 'project'))
            .filter(document => document !== undefined)[0];
    }


    private async loadBackupFile(filePath: string, project: string): Promise<any> {

        let database: any = new PouchDB(project);
        
        // to prevent pouchdb-load's incremental loading and force a true overwrite of the old db
        await database.destroy();

        database = new PouchDB(project);
        PouchDB.plugin(pouchDBLoad);

        await (database as any).load('file://' + filePath);

        return database;
    }


    private async updateProjectIdentifier(projectDocument: Document, project: string, restoredDatabase: any) {

        projectDocument.resource.identifier = project;
        await restoredDatabase.put(projectDocument, { force: true });
    }
}
