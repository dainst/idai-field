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
        const date = parse(dateString, format, new Date());
        if (isNaN(date.getTime())) continue;
        if (latestPossibleDate) setToLatestPossibleDate(date, format);

        return convertToUTC(date, format, timezone);
    }

    return undefined;
}


function setToLatestPossibleDate(date: Date, format: string) {

    const segmentsCount: number = format.split('.').length;
    if (segmentsCount === 1) date.setMonth(11);
    if (segmentsCount < 3) date.setDate(31);
}


function convertToUTC(date: Date, format: string, timezone: string): Date {

    if (!format.includes('HH:mm')) return date;
    
    return fromZonedTime(date, timezone);
}
