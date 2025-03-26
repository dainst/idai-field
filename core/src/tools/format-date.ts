import { Locale, de, enUS, it, pt, tr, uk } from 'date-fns/locale'
import { formatInTimeZone } from 'date-fns-tz';


export type TimeSettings = 'none'|'short'|'long';


export function formatDate(date: Date, locale?: string, timezone: string = 'UTC',
                           timeSettings: TimeSettings = 'long'): string {

    switch (timeSettings) {
        case 'none':
            return locale
                ? formatInTimeZone(date, timezone, 'PPP', { locale: getLocaleObject(locale) })
                : formatInTimeZone(date, timezone, 'dd.MM.yyyy');
        case 'short':
            return locale
                ? formatInTimeZone(date, timezone, 'PPP p', { locale: getLocaleObject(locale) })
                : formatInTimeZone(date, timezone, 'dd.MM.yyyy HH:mm');
        case 'long':
            return locale
                ? formatInTimeZone(date, timezone, 'PPP pp', { locale: getLocaleObject(locale) })
                : formatInTimeZone(date, timezone, 'dd.MM.yyyy HH:mm:ss');
    }
}


function getLocaleObject(locale: string): Locale {

    switch (locale) {
        case 'de':
            return de;
        case 'it':
            return it;
        case 'pt':
            return pt;
        case 'tr':
            return tr;
        case 'uk':
            return uk;
        default:
            return enUS;
    }
}

