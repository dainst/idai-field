import { Backup } from '../model/backup';
import { BackupsMap } from '../model/backups-map';
import { parseBackupFileName } from './backup-file-name-utils';

const fs = require('fs');


export function getExistingBackups(backupDirectoryPath: string, includeSize: boolean = false): BackupsMap {

    if (!fs.existsSync(backupDirectoryPath)) return {};

    const fileNames: string[] = fs.readdirSync(backupDirectoryPath);

    const existingBackups: BackupsMap = fileNames.reduce((result, fileName) => {
        const { project, creationDate } = parseBackupFileName(fileName) ?? {};
        if (project && creationDate) {
            if (!result[project]) result[project] = [];
            const backup: Backup = { 
                filePath: backupDirectoryPath + '/' + fileName,
                project,
                creationDate
            }
            if (includeSize) backup.size = fs.statSync(backupDirectoryPath + '/' + fileName).size;
            result[project].push(backup);
        }
        return result;
    }, {});

    sortBackups(existingBackups);

    return existingBackups;
}


function sortBackups(backups: BackupsMap) {

    Object.values(backups).forEach(projectBackups => {
        projectBackups.sort((backup1, backup2) => {
            return backup1.creationDate.getTime() - backup2.creationDate.getTime();
        });
    });
}
