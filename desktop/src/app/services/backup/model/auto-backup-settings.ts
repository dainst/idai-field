export interface AutoBackupSettings {

    backupsInfoFilePath: string;
    backupDirectoryPath: string;
    projects: string[];
    selectedProject: string;
    interval: number;
}
