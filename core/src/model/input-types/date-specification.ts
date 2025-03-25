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

    export function generateLabel(date: DateSpecification, timezone: string): string {

        let result: string = getValueLabel(date.value, timezone)
        if (date.endValue) result += ' - ' + getValueLabel(date.endValue, timezone);

        return result;
    }


    function getValueLabel(value: string, timezone: string): string {

        const date: Date = parseDate(value);
        return formatDate(date, timezone, value.includes(':'));
    }
}
