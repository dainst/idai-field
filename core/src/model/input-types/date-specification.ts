import { parseDate } from '../../tools/parse-date';
import { formatDate } from '../../tools/format-date';


/**
 * @author Thomas Kleinke
 */
export interface DateSpecification {

    value: string;
    endValue?: string;
}


export module DateSpecification {

    export function generateLabel(date: DateSpecification, timezone: string, timeSuffix: string,
                                  locale: string): string {

        let result: string = getValueLabel(date.value, timezone, timeSuffix, locale, !date.endValue);
        if (date.endValue) result += ' - ' + getValueLabel(date.endValue, timezone, timeSuffix, locale, true);

        return result;
    }


    function getValueLabel(value: string, timezone: string, timeSuffix: string, locale: string, addTimezoneInfo: boolean): string {
        
        const hasTimeValue: boolean = value.includes(':');
        const date: Date = parseDate(value);
        let formattedDate: string = formatDate(date, locale, timezone, hasTimeValue ? 'short' : 'none');

        // If the time suffix is set to '.', this indicates that no time suffix should be used
        if (hasTimeValue && timeSuffix !== '.') formattedDate = formattedDate + ' ' + timeSuffix;
        
        if (addTimezoneInfo && hasTimeValue) formattedDate += ' (' + timezone + ')';

        return formattedDate;
    }
}
