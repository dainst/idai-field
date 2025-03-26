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

    export function generateLabel(date: DateSpecification, timezone: string, timeSuffix: string): string {

        let result: string = getValueLabel(date.value, timezone, timeSuffix);
        if (date.endValue) result += ' - ' + getValueLabel(date.endValue, timezone, timeSuffix);

        return result;
    }


    function getValueLabel(value: string, timezone: string, timeSuffix: string): string {
        
        const hasTimeValue: boolean = value.includes(':');
        const date: Date = parseDate(value);
        const formattedDate: string = formatDate(date, timezone, hasTimeValue);

        return hasTimeValue && timeSuffix !== '.'
            ? formattedDate + ' ' + timeSuffix
            : formattedDate;
    }
}
