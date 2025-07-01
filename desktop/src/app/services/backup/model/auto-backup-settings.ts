import { KeepBackupsSettings } from '../../settings/keep-backups-settings';


export interface AutoBackupSettings {

    backupsInfoFilePath: string;
    backupDirectoryPath: string;
    projects: string[];
    keepBackups: KeepBackupsSettings;
    interval: number;
    maxWorkers: number;
}
