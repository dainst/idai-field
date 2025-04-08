import { parse } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';


const ALLOWED_DATE_FORMATS: string[] = [
    'dd.MM.yyyy HH:mm',
    'dd.MM.yyyy',
    'MM.yyyy',
    'yyyy'
];


export function parseDate(dateString: string, timezone: string = 'UTC',
                          latestPossibleDate: boolean = false): Date|undefined {

    if (typeof dateString !== 'string') return undefined;

    for (let format of ALLOWED_DATE_FORMATS) {
        let date = parse(dateString, format, new Date());
        if (isNaN(date.getTime())) continue;

        date = fromZonedTime(date, timezone);
        if (latestPossibleDate) setToLatestPossibleDate(date, format);

        return date;
    }

    return undefined;
}


function setToLatestPossibleDate(date: Date, format: string) {

    const segmentsCount: number = format.split('.').length;

    if (segmentsCount === 1) {
        // Set month to December
        date.setMonth(11);
    }

    if (segmentsCount < 3) {
        // Set date to last day of month
        date.setMonth(date.getMonth() + 1);
        date.setDate(0);
    }

    if (!format.includes(':')) {
        // Set time to latest possible time of the day
        date.setHours(23);
        date.setMinutes(59);
    }
}
