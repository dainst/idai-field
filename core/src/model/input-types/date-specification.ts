import { isObject } from 'tsfun';
import { parseDate } from '../../tools/parse-date';
import { formatDate } from '../../tools/format-date';
import { Field } from '../configuration/field';
import { DateConfiguration } from '../configuration/date-configuration';


/**
 * @author Thomas Kleinke
 */
export interface DateSpecification {

    value: string;
    endValue?: string;
}


export module DateSpecification {

    export function validate(date: DateSpecification, field: Field): boolean {

        if (!isObject(date) || !validateDateValue(date.value, field)) return false;

        if (field.dateConfiguration?.inputMode === DateConfiguration.InputMode.SINGLE && date.endValue !== undefined) {
            return false;
        }

        if (field.dateConfiguration?.inputMode === DateConfiguration.InputMode.RANGE
               && !validateDateValue(date.endValue, field)) {
            return false;
        }

        return true;
    }


    export function generateLabel(date: DateSpecification, timezone: string, timeSuffix: string,
                                  locale: string): string {

        try {
            let result: string = getValueLabel(date.value, timezone, timeSuffix, locale, !date.endValue);
            if (date.endValue) result += ' - ' + getValueLabel(date.endValue, timezone, timeSuffix, locale, true);
            return result;
        } catch (_) {
            return null;
        }
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


    function validateDateValue(dateValue: string, field: Field) {

        if (!dateValue || isNaN(parseDate(dateValue)?.getTime())) return false;

        if (field.dateConfiguration?.dataType === DateConfiguration.DataType.DATE_TIME && !dateValue.includes(':')) {
            return false;
        }
        
        if (field.dateConfiguration?.dataType === DateConfiguration.DataType.DATE && dateValue.includes(':')) {
            return false;
        }

        return true;
    }
}
