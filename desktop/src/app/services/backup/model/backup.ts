export interface Backup {

    fileName: string;
    updateSequence: number;
    creationDate: Date;
}


export module Backup {

    export function getFilePath(backup: Backup, backupDirectoryPath: string): string {

        return backupDirectoryPath + '/' + backup.fileName;
    }
}
