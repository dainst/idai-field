import { formatInTimeZone } from 'date-fns-tz';


export function formatDate(date: Date, timezone: string = 'Europe/London', withTime: boolean = true): string {

    return withTime
        ? formatInTimeZone(date, timezone, 'dd.MM.yyyy HH:mm')
        : formatInTimeZone(date, timezone, 'dd.MM.yyyy');
}
