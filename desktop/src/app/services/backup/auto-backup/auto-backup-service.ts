import { Injectable } from '@angular/core';
import { SettingsProvider } from '../../settings/settings-provider';
import { AutoBackupSettings } from '../model/auto-backup-settings';

const remote = window.require('@electron/remote');

const AUTO_BACKUP_INTERVAL: number = 5000;


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class AutoBackupService {

    private worker: Worker;


    constructor(private settingsProvider: SettingsProvider) {}


    public start() {

        const settings: AutoBackupSettings = {
            backupsInfoFilePath: remote.getGlobal('appDataPath') + '/backups.json',
            backupDirectoryPath: this.settingsProvider.getSettings().backupDirectoryPath,
            projects: this.settingsProvider.getSettings().dbs,
            selectedProject: this.settingsProvider.getSettings().selectedProject,
            interval: AUTO_BACKUP_INTERVAL
        };

        this.worker = new Worker(new URL('./auto-backup.worker', import.meta.url));

        this.worker.onmessage = ({ data }) => console.log(data);

        this.worker.postMessage({
            command: 'start',
            settings
        });
    }
}
