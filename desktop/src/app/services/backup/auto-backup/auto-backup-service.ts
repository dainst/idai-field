import { Injectable } from '@angular/core';
import { SettingsProvider } from '../../settings/settings-provider';
import { AutoBackupSettings } from '../model/auto-backup-settings';
import { AUTO_BACKUP, createWorker } from '../../create-worker';
import { BACKUP_FILE_CREATION_FAILED, INVALID_BACKUP_DIRECTORY_PATH } from './auto-backup-errors';
import { Messages } from '../../../components/messages/messages';
import { M } from '../../../components/messages/m';

const remote = window.require('@electron/remote');
const os = window.require('os');


const AUTO_BACKUP_INTERVAL: number = 5000;


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class AutoBackupService {

    private running: boolean = false;
    private worker: Worker;
    private resolveRequest: () => void;


    constructor(private settingsProvider: SettingsProvider,
                private messages: Messages) {}


    public start() {

        if (remote.getGlobal('mode') === 'test') return;

        this.worker = createWorker(AUTO_BACKUP);

        this.worker.onmessage = ({ data }) => {
            if (data.running !== undefined) this.running = data.running;
            if (data.error) this.handleError(data.error);
            if (!this.running && this.resolveRequest) {
                this.resolveRequest();
                this.resolveRequest = undefined;
            }
        };

        this.worker.postMessage({
            command: 'start',
            settings: this.getSettings()
        });

        this.settingsProvider.settingsChangesNotifications().subscribe(() => this.updateSettings());
    }


    public requestBackupCreation(): Promise<void> {

        if (remote.getGlobal('mode') === 'test') return;

        if (!this.running) this.worker.postMessage({ command: 'createBackups' });

        return new Promise(resolve => {
            this.resolveRequest = resolve;
        });
    }


    private updateSettings() {

        if (!this.worker) return;

        this.worker.postMessage({
            command: 'updateSettings',
            settings: this.getSettings()
        });
    }


    private getSettings(): AutoBackupSettings {

        return {
            backupsInfoFilePath: remote.getGlobal('appDataPath') + '/backups.json',
            backupDirectoryPath: this.settingsProvider.getSettings().backupDirectoryPath,
            projects: this.settingsProvider.getSettings().dbs,
            keepBackups: this.settingsProvider.getSettings().keepBackups,
            interval: AUTO_BACKUP_INTERVAL,
            maxWorkers: this.getMaxWorkers()
        };
    }


    private getMaxWorkers(): number {

        const cores: any[] = os.cpus() ?? [];

        console.log('CPU Cores:', cores);

        return cores.length <= 4
            ? 1
            : 1 + Math.floor(cores.length / 4);
    }


    private handleError(error: string) {

        switch (error) {
            case INVALID_BACKUP_DIRECTORY_PATH:
                this.messages.add([M.BACKUP_INVALID_AUTO_BACKUP_DIRECTORY]);
                break;
            case BACKUP_FILE_CREATION_FAILED:
                this.messages.add([M.BACKUP_AUTOMATIC_FILE_CREATION_FAILED]);
                break;
        }
    }
}
