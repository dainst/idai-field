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

    private activeErrorMessage: string;


    constructor(private settingsProvider: SettingsProvider,
                private messages: Messages) {}


    public start() {

        if (remote.getGlobal('mode') === 'test') return;

        this.worker = createWorker(AUTO_BACKUP);
        this.worker.onmessage = ({ data }) => this.handleWorkerMessage(data);
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

        console.log('Number of CPU Cores:', cores.length);

        let maxWorkers: number = cores.length <= 4
            ? 1
            : 1 + Math.floor(cores.length / 4);

        return Math.min(3, maxWorkers);
    }


    private handleWorkerMessage(messageData: any) {

        if (messageData.running !== undefined) {
            this.running = messageData.running;
            if (!messageData.running) this.activeErrorMessage = undefined;
        }

        if (messageData.error) this.handleError(messageData.error);

        if ((!this.running || messageData.error) && this.resolveRequest) {
            this.resolveRequest();
            this.resolveRequest = undefined;
        }
    }


    private handleError(error: string) {

        const errorMessage: string = AutoBackupService.getErrorMessage(error);

        if (this.activeErrorMessage !== errorMessage) this.messages.add([errorMessage]);
        this.activeErrorMessage = errorMessage;
    }


    private static getErrorMessage(error: string): string {

        switch (error) {
            case INVALID_BACKUP_DIRECTORY_PATH:
                return M.BACKUP_INVALID_AUTO_BACKUP_DIRECTORY;
            case BACKUP_FILE_CREATION_FAILED:
                return M.BACKUP_AUTOMATIC_FILE_CREATION_FAILED;
        }
    }
}
