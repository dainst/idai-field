import { Injectable } from '@angular/core';
import { SettingsProvider } from '../settings/settings-provider';

const remote = window.require('@electron/remote');


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class AutoBackupService {

    private worker: Worker;

    constructor(private settingsProvider: SettingsProvider) {}


    public start() {

        const backupsInfoFilePath: string = remote.getGlobal('appDataPath') + '/backups.json';
        const backupDirectoryPath: string = this.settingsProvider.getSettings().backupDirectoryPath;
        this.worker = new Worker(new URL('./auto-backup.worker', import.meta.url));

        this.worker.onmessage = ({ data }) => console.log(data);
        this.worker.postMessage({
            command: 'start',
            settings: {
                backupsInfoFilePath,
                backupDirectoryPath,
                projects: this.settingsProvider.getSettings().dbs
            }
        });
    }
}
