import { isObject } from 'tsfun';
import { parseDate } from '../../tools/parse-date';
import { formatDate } from '../../tools/format-date';
import { Field } from '../configuration/field';
import { DateConfiguration } from '../configuration/date-configuration';


export type DateValidationResult = 'valid'
    |'invalid'
    |'rangeNotAllowed'
    |'singleNotAllowed'
    |'timeNotAllowed'
    |'timeNotSet'
    |'endDateBeforeBeginningDate';


export module DateValidationResult {

    export const VALID = 'valid';
    export const INVALID = 'invalid';
    export const RANGE_NOT_ALLOWED = 'rangeNotAllowed';
    export const SINGLE_NOT_ALLOWED = 'singleNotAllowed';
    export const TIME_NOT_ALLOWED = 'timeNotAllowed';
    export const TIME_NOT_SET = 'timeNotSet';
    export const END_DATE_BEFORE_BEGINNING_DATE = 'endDateBeforeBeginningDate';
}


/**
 * @author Thomas Kleinke
 */
export interface DateSpecification {

    value?: string;
    endValue?: string;
    isRange: boolean;
}


export module DateSpecification {

    export const VALUE: string = 'value';
    export const END_VALUE: string = 'endValue';
    export const IS_RANGE: string = 'isRange';


    export function validate(date: DateSpecification, field: Field,
                             permissive: boolean = false): DateValidationResult {

        if (!isObject(date) || (!date.value && !date.endValue)) return DateValidationResult.INVALID;
                
        let validationResult: DateValidationResult = validateDateValue(date.value, field, permissive);
        if (validationResult !== DateValidationResult.VALID) return validationResult;
    
        validationResult = validateDateValue(date.endValue, field, permissive);
        if (validationResult !== DateValidationResult.VALID) return validationResult;

        if (permissive) return DateValidationResult.VALID;

        if (!date.isRange && date.endValue) return DateValidationResult.INVALID;

        if (field.dateConfiguration.inputMode === DateConfiguration.InputMode.SINGLE
                && (date.isRange || date.endValue !== undefined)) {
            return DateValidationResult.RANGE_NOT_ALLOWED;
        }

        if (field.dateConfiguration.inputMode === DateConfiguration.InputMode.RANGE
                && (!date.isRange || date.endValue == undefined)) {
            return DateValidationResult.SINGLE_NOT_ALLOWED;
        }

        if (!validateRange(date.value, date.endValue)) {
            return DateValidationResult.END_DATE_BEFORE_BEGINNING_DATE;
        }

        return DateValidationResult.VALID;
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


    function validateDateValue(dateValue: string, field: Field, permissive: boolean): DateValidationResult {

        if (!dateValue) return DateValidationResult.VALID;
            
        if (isNaN(parseDate(dateValue)?.getTime())) return DateValidationResult.INVALID;

        if (permissive) return DateValidationResult.VALID;

        if (field.dateConfiguration.dataType === DateConfiguration.DataType.DATE && dateValue.includes(':')) {
            return DateValidationResult.TIME_NOT_ALLOWED;
        }

        if (field.dateConfiguration.dataType === DateConfiguration.DataType.DATE_TIME && !dateValue.includes(':')) {
            return DateValidationResult.TIME_NOT_SET;
        }

        return DateValidationResult.VALID;
    }


    function validateRange(value: string, endValue: string): boolean {

        if (!value || !endValue) return true;

        const beginningDate: Date = parseDate(value, 'UTC');
        const endDate: Date = parseDate(endValue, 'UTC', true);

        return beginningDate <= endDate;
    }
}
