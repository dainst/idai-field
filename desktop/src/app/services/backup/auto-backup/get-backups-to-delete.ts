import { isSameDay, isSameWeek, isSameMonth, differenceInDays, differenceInWeeks,
    differenceInCalendarMonths } from 'date-fns';
import { KeepBackupsSettings } from '../../settings/keep-backups-settings';
import { Backup } from '../model/backup';
import { BackupsInfo } from '../model/backups-info';


export function getBackupsToDelete(backupsInfo: BackupsInfo, settings: KeepBackupsSettings,
                                   currentDate: Date): Array<Backup> {

    return Object.values(backupsInfo.backups).reduce((result, backups) => {
        return result.concat(getBackupsToDeleteForProject(backups, settings, currentDate));
    }, []);
}


function getBackupsToDeleteForProject(backups: Array<Backup>, settings: KeepBackupsSettings,
                                      currentDate: Date): Array<Backup> {

    if (!backups.length) return [];

    const daily: Array<Backup> = getDailyBackupsToKeep(backups, settings, currentDate);
    const weekly: Array<Backup> = getWeeklyBackupsToKeep(backups, settings, currentDate);
    const monthly: Array<Backup> = getMonthlyBackupsToKeep(backups, settings, currentDate);

    return backups.filter(backup => !daily.includes(backup) && !weekly.includes(backup) && !monthly.includes(backup));
}


function getDailyBackupsToKeep(backups: Array<Backup>, settings: KeepBackupsSettings,
                               currentDate: Date): Array<Backup> {

    const sortedBackups: Array<Array<Backup>> = getSortedBackups(backups, isSameDay);
    const result: Array<Backup> = sortedBackups.map(backups => backups[0])
        .filter(backup => {
            return differenceInDays(
                normalizeTime(currentDate),
                normalizeTime(backup.creationDate)
            ) < settings.daily;
        }).slice(0, settings.daily);

    return result.length
        ? result
        : [backups[backups.length - 1]]; // Always keep latest backup
}


function getWeeklyBackupsToKeep(backups: Array<Backup>, settings: KeepBackupsSettings,
                                currentDate: Date): Array<Backup> {

    if (settings.weekly === 0) return [];

    const sameWeek = (date1: Date, date2: Date) => isSameWeek(date1, date2, { weekStartsOn: 1 });

    const sortedBackups: Array<Array<Backup>> = getSortedBackups(backups, sameWeek);
    return sortedBackups.map(backups => backups[backups.length - 1])
        .filter(backup => {
            return differenceInWeeks(
                normalizeTime(currentDate),
                normalizeTime(backup.creationDate)
            ) < settings.weekly
        }).slice(0, settings.weekly);
}


function getMonthlyBackupsToKeep(backups: Array<Backup>, settings: KeepBackupsSettings,
                                 currentDate: Date): Array<Backup> {

    if (settings.monthly === 0) return [];

    const sortedBackups: Array<Array<Backup>> = getSortedBackups(backups, isSameMonth);
    return sortedBackups.map(backups => backups[backups.length - 1])
        .filter(backup => {
            return differenceInCalendarMonths(
                normalizeTime(currentDate),
                normalizeTime(backup.creationDate)
            ) < settings.monthly
        }).slice(0, settings.monthly);
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


function normalizeTime(date: Date): Date {

    const result: Date = new Date(date);
    result.setHours(0, 0, 0, 0);

    return result;
}
