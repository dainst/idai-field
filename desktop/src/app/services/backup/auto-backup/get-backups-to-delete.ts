import { isSameDay, isSameWeek as sameWeek, isSameMonth } from 'date-fns';
import { KeepBackupsSettings } from '../../settings/keep-backups-settings';
import { Backup } from '../model/backup';
import { BackupsMap } from '../model/backups-map';


export function getBackupsToDelete(backups: BackupsMap, recentlyCreatedBackups: { [project: string]: Array<Backup> },
                                   settings: KeepBackupsSettings): Array<Backup> {

    return Object.entries(backups).reduce((result, [project, backups]) => {
        return result.concat(getBackupsToDeleteForProject(backups, recentlyCreatedBackups[project], settings));
    }, []);
}


function getBackupsToDeleteForProject(backups: Array<Backup>, recentlyCreatedBackups: Array<Backup>,
                                      settings: KeepBackupsSettings): Array<Backup> {

    if (!backups.length) return [];

    const recentlyUpdatedBackups: Array<Backup> = getRecentlyUpdatedBackups(backups, recentlyCreatedBackups);

    const outdatedBackups: Array<Backup> = getOutdatedBackups(
        backups.filter(backup => !recentlyUpdatedBackups.includes(backup)),
        settings
    );
    
    return recentlyUpdatedBackups.concat(outdatedBackups);
}


function getRecentlyUpdatedBackups(backups: Array<Backup>, recentlyCreatedBackups: Array<Backup>): Array<Backup> {

    if (!recentlyCreatedBackups || recentlyCreatedBackups.length < 2) {
        return [];
    } else {
        const filePaths: string[] = recentlyCreatedBackups.slice(0, -1).map(backup => backup.filePath);
        return backups.filter(backup => filePaths.includes(backup.filePath));
    }
}


function getOutdatedBackups(backups: Array<Backup>, settings: KeepBackupsSettings): Array<Backup> {

    const daily: Array<Backup> = getBackupsToKeep(backups, settings.daily, isSameDay);
    const weekly: Array<Backup> = getBackupsToKeep(backups, settings.weekly, isSameWeek);
    const monthly: Array<Backup> = getBackupsToKeep(backups, settings.monthly, isSameMonth);

    return backups.filter(backup => {
        return !daily.includes(backup)
            && !weekly.includes(backup)
            && !monthly.includes(backup)
            && backup !== backups[backups.length - 1];
    });
}


function getBackupsToKeep(backups: Array<Backup>, amountToKeep: number,
                          isInSameTimespan: (date1: Date, date2: Date) => boolean) {
        
    if (amountToKeep === 0) return [];

    const sortedBackups: Array<Array<Backup>> = getSortedBackups(backups, isInSameTimespan);
    return sortedBackups.map(backups => backups[backups.length - 1]).slice(0, amountToKeep);  
}


function getSortedBackups(backups: Array<Backup>,
                          isInSameTimespan: (date1: Date, date2: Date) => boolean): Array<Array<Backup>> {

    let lastAddedBackup: Backup = undefined;

    return backups.slice().reverse().reduce((result, backup) => {
        if (!lastAddedBackup || !isInSameTimespan(backup.creationDate, lastAddedBackup.creationDate)) {
            result.push([backup]);
        } else {
            result[result.length - 1].push(backup);
        }
        lastAddedBackup = backup;
        return result;
    }, []);
}


function isSameWeek(date1: Date, date2: Date) {
    
    return sameWeek(date1, date2, { weekStartsOn: 1 });
}
