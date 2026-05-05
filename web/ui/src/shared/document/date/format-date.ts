import { Locale, de, enUS } from 'date-fns/locale'
import { formatInTimeZone } from 'date-fns-tz';


export type DateFormat = 'year'|'month'|'date'|'shortTime'|'longTime';


export function formatDate(date: Date, locale?: string, timezone: string = 'UTC',
                           timeSettings: DateFormat = 'longTime'): string {

    switch (timeSettings) {
        case 'year':
            return formatInTimeZone(date, timezone, 'yyyy');
        case 'month':
            return locale
                ? formatInTimeZone(date, timezone, 'LLLL yyyy', { locale: getLocaleObject(locale) })
                : formatInTimeZone(date, timezone, 'MM.yyyy');
        case 'date':
            return locale
                ? formatInTimeZone(date, timezone, 'PPP', { locale: getLocaleObject(locale) })
                : formatInTimeZone(date, timezone, 'dd.MM.yyyy');
        case 'shortTime':
            return locale
                ? formatInTimeZone(date, timezone, 'PPP p', { locale: getLocaleObject(locale) })
                : formatInTimeZone(date, timezone, 'dd.MM.yyyy HH:mm');
        case 'longTime':
            return locale
                ? formatInTimeZone(date, timezone, 'PPP pp', { locale: getLocaleObject(locale) })
                : formatInTimeZone(date, timezone, 'dd.MM.yyyy HH:mm:ss');
    }
}


function getLocaleObject(locale: string): Locale {

    return locale === 'de' ? de : enUS;
}

