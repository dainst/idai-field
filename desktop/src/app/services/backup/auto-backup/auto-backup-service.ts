import { Injectable } from '@angular/core';
import { ChangesStream } from 'idai-field-core';
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


    constructor(private settingsProvider: SettingsProvider,
                private changesStream: ChangesStream) {}


    public start() {

        const settings: AutoBackupSettings = {
            backupsInfoFilePath: remote.getGlobal('appDataPath') + '/backups.json',
            backupDirectoryPath: this.settingsProvider.getSettings().backupDirectoryPath,
            projects: this.settingsProvider.getSettings().dbs,
            interval: AUTO_BACKUP_INTERVAL
        };

        this.worker = new Worker(new URL('./auto-backup.worker', import.meta.url));

        this.worker.onmessage = ({ data }) => console.log(data);

        this.worker.postMessage({
            command: 'start',
            settings
        });

        this.changesStream.changesNotifications().subscribe(() => this.triggerBackup());
    }
}
