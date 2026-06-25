import { Injectable } from '@angular/core';
import { SettingsProvider } from '../../settings/settings-provider';
import { AutoBackupSettings } from '../model/auto-backup-settings';
import { BACKUP_FILE_CREATION_FAILED, INVALID_BACKUP_DIRECTORY_PATH } from './auto-backup-errors';
import { Messages } from '../../../components/messages/messages';
import { M } from '../../../components/messages/m';
import { Backup } from '../model/backup';
import { BackupsInfo } from '../model/backups-info';
import { BackupsMap } from '../model/backups-map';
import { createBackupFile, getUpdateSequence } from '../create-backup';
import { buildBackupFileName } from './backup-file-name-utils';
import { BackupsInfoSerializer } from './backups-info-serializer';
import { getBackupsToDelete } from './get-backups-to-delete';
import { getExistingBackups } from './get-existing-backups';

import { electronRemote as remote } from 'src/app/electron/electron';
import { electronOs as os } from 'src/app/electron/electron';
import { electronFs as fs } from 'src/app/electron/electron';


const AUTO_BACKUP_INTERVAL: number = 5000;


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class AutoBackupService {

    private running: boolean = false;
    private resolveRequest: () => void;
    private settings: AutoBackupSettings;
    private backupsInfoSerializer: BackupsInfoSerializer;
    private runTimeout: any;
    private error: boolean = false;
    private activeBackups: number = 0;

    private projectQueue: string[] = [];
    private recentlyCreatedBackups: { [project: string]: Array<Backup> } = {};


    constructor(private settingsProvider: SettingsProvider,
                private messages: Messages) {}


    public start() {

        if (remote.getGlobal('mode') === 'test') return;

        this.settings = this.getSettings();
        this.backupsInfoSerializer = new BackupsInfoSerializer(this.settings.backupsInfoFilePath, fs);
        void this.run();

        this.settingsProvider.settingsChangesNotifications().subscribe(() => this.updateSettings());
    }


    public requestBackupCreation(): Promise<void> {

        if (remote.getGlobal('mode') === 'test') return Promise.resolve();

        if (!this.running) void this.run();

        return new Promise(resolve => {
            this.resolveRequest = resolve;
            if (!this.running) this.resolvePendingRequest();
        });
    }


    private updateSettings() {

        this.settings = this.getSettings();
        this.backupsInfoSerializer = new BackupsInfoSerializer(this.settings.backupsInfoFilePath, fs);
        this.error = false;
    }


    private async run() {

        await this.updateBackups();

        if (this.runTimeout) clearTimeout(this.runTimeout);

        this.runTimeout = setTimeout(() => {
            this.runTimeout = undefined;
            void this.run();
        }, this.settings.interval);
    }


    private async updateBackups() {

        if (this.running || this.projectQueue.length || this.error || !this.initializeBackupDirectory()) return;

        this.setRunning(true);

        const backupsInfo: BackupsInfo = this.backupsInfoSerializer.load();
        const existingBackups: BackupsMap = getExistingBackups(this.settings.backupDirectoryPath);
        this.deleteUnneededBackups(existingBackups);
        await this.fillQueue(backupsInfo, existingBackups);
        this.updateListOfRecentlyUpdatedBackups();
        this.backupsInfoSerializer.store(backupsInfo);
        this.startBackups();

        if (!this.activeBackups && !this.projectQueue.length) this.setRunning(false);
    }


    private initializeBackupDirectory(): boolean {

        if (fs.existsSync(this.settings.backupDirectoryPath)) return true;

        try {
            fs.mkdirSync(this.settings.backupDirectoryPath);
            return true;
        } catch (_) {
            this.error = true;
            this.handleError(INVALID_BACKUP_DIRECTORY_PATH);
            return false;
        }
    }


    private async fillQueue(backupsInfo: BackupsInfo, existingBackups: BackupsMap) {

        for (let project of this.settings.projects) {
            if (await this.needsBackup(project, backupsInfo, existingBackups)) {
                this.projectQueue.push(project);
            }
        }
    }


    private startBackups() {

        while (this.activeBackups < this.settings.maxWorkers && this.projectQueue.length) {
            this.startNextBackup();
        }
    }


    private startNextBackup() {

        const project: string = this.projectQueue.shift();
        const creationDate: Date = new Date();
        const targetFilePath: string = this.buildBackupFilePath(project, creationDate);

        this.activeBackups++;

        createBackupFile(targetFilePath, project)
            .then(updateSequence => {
                if (updateSequence !== undefined) this.updateBackupsInfo(project, updateSequence);
                this.rememberCreatedBackup(project, targetFilePath, creationDate);
            })
            .catch(err => {
                console.error('Error while creating backup file:', err);
                this.handleError(BACKUP_FILE_CREATION_FAILED);
            })
            .finally(() => this.onBackupFinished());
    }


    private onBackupFinished() {

        this.activeBackups--;

        if (!this.activeBackups && !this.projectQueue.length) {
            this.setRunning(false);
        } else {
            this.startBackups();
        }
    }


    private async needsBackup(project: string, backupsInfo: BackupsInfo, existingBackups: BackupsMap): Promise<boolean> {

        if (project === 'test') return false;

        const updateSequence = await getUpdateSequence(project);
        if (!updateSequence) return false;

        return !existingBackups[project]?.length || backupsInfo.lastUpdateSequence[project] !== updateSequence;
    }


    private buildBackupFilePath(project: string, creationDate: Date): string {

        return this.settings.backupDirectoryPath + '/' + buildBackupFileName(project, creationDate);
    }


    private updateBackupsInfo(project: string, updateSequence: number) {

        const backupsInfo: BackupsInfo = this.backupsInfoSerializer.load();
        backupsInfo.lastUpdateSequence[project] = updateSequence;
        this.backupsInfoSerializer.store(backupsInfo);
    }


    private rememberCreatedBackup(project: string, filePath: string, creationDate: Date) {

        if (!this.recentlyCreatedBackups[project]) this.recentlyCreatedBackups[project] = [];
        this.recentlyCreatedBackups[project].push({ filePath, project, creationDate });
    }


    private deleteUnneededBackups(existingBackups: BackupsMap) {

        getBackupsToDelete(existingBackups, this.recentlyCreatedBackups, this.settings.keepBackups)
            .forEach(backupToDelete => {
                fs.rmSync(backupToDelete.filePath);

                const project: string = backupToDelete.project;
                if (this.recentlyCreatedBackups[project]) {
                    this.recentlyCreatedBackups[project] = this.recentlyCreatedBackups[project].filter(backup => {
                        return backup.filePath !== backupToDelete.filePath;
                    });
                }
            });
    }


    private updateListOfRecentlyUpdatedBackups() {

        Object.keys(this.recentlyCreatedBackups).forEach(project => {
            if (!this.projectQueue.includes(project)) delete this.recentlyCreatedBackups[project];
        });
    }


    private setRunning(running: boolean) {

        this.running = running;
        if (!running) this.resolvePendingRequest();
    }


    private resolvePendingRequest() {

        if (!this.resolveRequest) return;

        this.resolveRequest();
        this.resolveRequest = undefined;
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
