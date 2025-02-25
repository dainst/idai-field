import { Document } from 'idai-field-core';
import { ProjectIdentifierValidation } from '../../model/project-identifier-validation';
import { SettingsService } from '../settings/settings-service';
import { CREATE_BACKUP, createWorker } from '../create-worker';

const fs = window.require('fs');
const PouchDB = window.require('pouchdb-browser');
const pouchDBLoad = window.require('pouchdb-load');


export type RestoreBackupResult = {
    success: boolean;
    error?: RestoreBackupError;
    unsimilarProjectIdentifier?: boolean;
}

export type RestoreBackupError = 'fileNotFound'|'generic';

export const ERROR_FILE_NOT_FOUND: RestoreBackupError = 'fileNotFound';
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


    public async restore(filePath: string, project: string,
                         settingsService: SettingsService): Promise<RestoreBackupResult> {

        if (!fs.existsSync(filePath) || !fs.lstatSync(filePath).isFile()) {
            return { success: false, error: ERROR_FILE_NOT_FOUND };
        }

        try {
            const restoredDatabase: PouchDB.Database = await this.loadBackupFile(filePath, project);
            const projectDocument: Document = await restoredDatabase.get('project');

            const unsimilarProjectIdentifier: boolean = !ProjectIdentifierValidation.isSimilar(
                projectDocument.resource.identifier, project
            );

            await this.updateProjectIdentifier(projectDocument, project, restoredDatabase);
            await settingsService.updateProjectName(projectDocument);

            return {
                success: true,
                unsimilarProjectIdentifier
            };
        } catch (err) {
            console.error('Error while trying to restore backup file', err);
            return { success: false, error: ERROR_GENERIC };
        }
    }


    private async loadBackupFile(filePath: string, project: string): Promise<PouchDB.Database> {

        let database: PouchDB.Database = new PouchDB(project);
        
        // to prevent pouchdb-load's incremental loading and force a true overwrite of the old db
        await database.destroy();

        database = new PouchDB(project);
        PouchDB.plugin(pouchDBLoad);

        await (database as any).load('file://' + filePath);

        return database;
    }


    private async updateProjectIdentifier(projectDocument: Document, project: string,
                                          restoredDatabase: PouchDB.Database) {

        projectDocument.resource.identifier = project;
        await restoredDatabase.put(projectDocument, { force: true });
    }
}
