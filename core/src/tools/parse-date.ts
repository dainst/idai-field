import { parse } from 'date-fns';


const ALLOWED_DATE_FORMATS: string[] = [
    'dd.MM.yyyy',
    'MM.yyyy',
    'yyyy'
];


export function parseDate(dateString: string, latestPossibleDate: boolean = false): Date|undefined {

    if (typeof dateString !== 'string') return undefined;

    for (let format of ALLOWED_DATE_FORMATS) {
        const date = parse(dateString, format, new Date());
        if (isNaN(date.getTime())) continue;
        if (latestPossibleDate) setToLatestPossibleDate(date, format);
        return date;
    }

    return undefined;
}


function setToLatestPossibleDate(date: Date, format: string) {

    const segmentsCount: number = format.split('.').length;
    if (segmentsCount === 1) date.setMonth(11);
    if (segmentsCount < 3) date.setDate(31);
}
