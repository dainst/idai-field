import { isSameDay, isSameWeek, isSameMonth } from 'date-fns';
import { KeepBackupsSettings } from '../../settings/keep-backups-settings';
import { Backup } from '../model/backup';
import { BackupsMap } from '../model/backups-map';


export function getBackupsToDelete(backups: BackupsMap, settings: KeepBackupsSettings): Array<Backup> {

    return Object.values(backups).reduce((result, backups) => {
        return result.concat(getBackupsToDeleteForProject(backups, settings));
    }, []);
}


function getBackupsToDeleteForProject(backups: Array<Backup>, settings: KeepBackupsSettings): Array<Backup> {

    if (!backups.length) return [];

    const daily: Array<Backup> = getDailyBackupsToKeep(backups, settings);
    const weekly: Array<Backup> = getWeeklyBackupsToKeep(backups, settings);
    const monthly: Array<Backup> = getMonthlyBackupsToKeep(backups, settings);

    return backups.filter(backup => !daily.includes(backup) && !weekly.includes(backup) && !monthly.includes(backup));
}


function getDailyBackupsToKeep(backups: Array<Backup>, settings: KeepBackupsSettings): Array<Backup> {

    const sortedBackups: Array<Array<Backup>> = getSortedBackups(backups, isSameDay);
    return sortedBackups.map(backups => backups[0]).slice(0, settings.daily);
}


function getWeeklyBackupsToKeep(backups: Array<Backup>, settings: KeepBackupsSettings): Array<Backup> {

    if (settings.weekly === 0) return [];

    const sameWeek = (date1: Date, date2: Date) => isSameWeek(date1, date2, { weekStartsOn: 1 });

    const sortedBackups: Array<Array<Backup>> = getSortedBackups(backups, sameWeek);
    return sortedBackups.map(backups => backups[backups.length - 1]).slice(0, settings.weekly);
}


function getMonthlyBackupsToKeep(backups: Array<Backup>, settings: KeepBackupsSettings): Array<Backup> {

    if (settings.monthly === 0) return [];

    const sortedBackups: Array<Array<Backup>> = getSortedBackups(backups, isSameMonth);
    return sortedBackups.map(backups => backups[backups.length - 1]).slice(0, settings.monthly);
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
