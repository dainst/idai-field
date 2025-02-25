import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { ObserverUtil } from 'idai-field-core';
import { SettingsProvider } from '../../settings/settings-provider';
import { AutoBackupSettings } from '../model/auto-backup-settings';
import { AUTO_BACKUP, createWorker } from '../../create-worker';

const remote = window.require('@electron/remote');
const os = window.require('os');


const AUTO_BACKUP_INTERVAL: number = 5000;


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class AutoBackupService {

    public running: boolean = false;

    private worker: Worker;
    private stopObservers: Array<Observer<void>> = [];


    constructor(private settingsProvider: SettingsProvider) {}


    public stopNotifications = (): Observable<void> => ObserverUtil.register(this.stopObservers);


    public start() {

        this.worker = createWorker(AUTO_BACKUP);

        this.worker.onmessage = ({ data }) => {
            this.running = data.running;
            if (!this.running) ObserverUtil.notify(this.stopObservers, null);
        };

        this.worker.postMessage({
            command: 'start',
            settings: this.getSettings()
        });

        this.settingsProvider.settingsChangesNotifications().subscribe(() => this.updateSettings());
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

        if (cores.length < 4) {
            return 1;
        } else if (cores.length < 8) {
            return 2;
        } else {
            return 3;
        }
    }
}
