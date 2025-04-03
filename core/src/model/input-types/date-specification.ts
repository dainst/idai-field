import { isObject } from 'tsfun';
import { parseDate } from '../../tools/parse-date';
import { formatDate } from '../../tools/format-date';
import { Field } from '../configuration/field';
import { DateConfiguration } from '../configuration/date-configuration';


/**
 * @author Thomas Kleinke
 */
export interface DateSpecification {

    value?: string;
    endValue?: string;
    isRange: boolean;
}


export module DateSpecification {

    export function validate(date: DateSpecification, field: Field, permissive: boolean = false): boolean {

        if (!isObject(date)
                || (!date.value && !date.endValue)
                || !validateDateValue(date.value, field, permissive)
                || !validateDateValue(date.endValue, field, permissive)) {
            return false;
        }

        if (permissive) return true;

        if (!date.isRange && date.endValue) return false;

        if (field.dateConfiguration?.inputMode === DateConfiguration.InputMode.SINGLE
                && (date.isRange || date.endValue !== undefined)) {
            return false;
        }

        return true;
    }


    export function generateLabel(date: DateSpecification, timezone: string, timeSuffix: string,
                                  locale: string, translate: (term: string) => string,
                                  addTimezoneInfo: boolean = true): string {

        try {
            let result: string = date.isRange
                ? generateRangeLabel(date, timezone, timeSuffix, locale, translate)
                : generateValueLabel(date.value, timezone, timeSuffix, locale);

            if (addTimezoneInfo && (date.value?.includes(':') || date.endValue?.includes(':'))) {
                result += date.isRange ? '\n' : ' ';
                result += '(' + timezone + ')';
            }

            return result;
        } catch (err) {
            console.error(err);
            return null;
        }
    }


    function generateRangeLabel(date: DateSpecification, timezone: string, timeSuffix: string,
                                locale: string, translate: (term: string) => string): string {

        let result: string = date.value
            ? generateValueLabel(date.value, timezone, timeSuffix, locale)
            : translate('unspecifiedDate');
        
        result += ' ' + translate('toDate') + '\n';
        result += date.endValue
            ? generateValueLabel(date.endValue, timezone, timeSuffix, locale)
            : translate('unspecifiedDate');
        
        return result;
    }


    function generateValueLabel(value: string, timezone: string, timeSuffix: string, locale: string): string {
        
        const hasTimeValue: boolean = value.includes(':');
        const date: Date = parseDate(value);
        let formattedDate: string = formatDate(date, locale, timezone, hasTimeValue ? 'short' : 'none');

        // If the time suffix is set to '.', this indicates that no time suffix should be used
        if (hasTimeValue && timeSuffix !== '.') formattedDate = formattedDate + ' ' + timeSuffix;

        return formattedDate;
    }


    function validateDateValue(dateValue: string, field: Field, permissive: boolean) {

        if (!dateValue) return true;
            
        if (isNaN(parseDate(dateValue)?.getTime())) return false;

        if (permissive) return true;

        if (field.dateConfiguration?.dataType === DateConfiguration.DataType.DATE && dateValue.includes(':')) {
            return false;
        }

        if (field.dateConfiguration?.dataType === DateConfiguration.DataType.DATE_TIME
                && !dateValue.includes(':')) {
            return false;
        }

        return true;
    }
}
