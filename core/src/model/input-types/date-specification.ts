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

        let result: string = getValueLabel(date.value, timezone, timeSuffix, locale);
        if (date.endValue) result += ' - ' + getValueLabel(date.endValue, timezone, timeSuffix, locale);

        return result;
    }


    function getValueLabel(value: string, timezone: string, timeSuffix: string, locale: string): string {
        
        const hasTimeValue: boolean = value.includes(':');
        const date: Date = parseDate(value);
        const formattedDate: string = formatDate(date, locale, timezone, hasTimeValue ? 'short' : 'none');

        // If the time suffix is set to '.', this indicates that no time suffix should be used
        return hasTimeValue && timeSuffix !== '.'
            ? formattedDate + ' ' + timeSuffix + ' (' + timezone + ')'
            : formattedDate + ' (' + timezone + ')';
    }
}
