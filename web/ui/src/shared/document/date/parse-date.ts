import { parse } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';


const ALLOWED_DATE_FORMATS: string[] = [
    'dd.MM.yyyy HH:mm',
    'dd.MM.yyyy',
    'MM.yyyy',
    'yyyy'
];


export function parseDate(dateString: string, timezone: string = 'UTC'): Date|undefined {

    if (typeof dateString !== 'string') return undefined;

    for (let format of ALLOWED_DATE_FORMATS) {
        let date = parse(dateString, format, new Date());
        if (isNaN(date.getTime())) continue;

        date = fromZonedTime(date, timezone);

        return date;
    }

    return undefined;
}
