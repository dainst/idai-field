export interface Backup {

    fileName: string;
    creationDate: Date;
}


export module Backup {

    export function getFilePath(backup: Backup, backupDirectoryPath: string): string {

        return backupDirectoryPath + '/' + backup.fileName;
    }
}
