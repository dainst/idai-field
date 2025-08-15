import { flow, detach, isNumber, isObject, isString } from 'tsfun';
import { I18N } from '../../tools/i18n';
import { Field } from '../configuration/field';


/**
 * @author Fabian Z.
 * @author Thomas Kleinke
 * @author Daniel de Oliveira 
 * 
 * Represents a value of input types "Dimension", "Weight" or "Volume"
 */
export interface Measurement {

    // Normalized values (in micrometres / micrograms / microlitres), calculated from input values
    value?: number;
    rangeMin?: number;
    rangeMax?: number;
    //

    // Input values as typed in by the user (in mm/cm/m, defined in inputUnit)
    inputValue: number;
    inputRangeEndValue?: number;
    inputUnit: Measurement.InputUnit;

    measurementPosition?: string; // Dimension only
    measurementScale?: string; // Weight only
    measurementComment?: I18N.String|string;
    isImprecise: boolean;

    isRange?: boolean; // Deprecated
    label?: string; // Deprecated
}


export module Measurement {

    export const VALUE = 'value';
    export const LABEL = 'label';
    export const ISRANGE = 'isRange';
    export const RANGEMIN = 'rangeMin';
    export const RANGEMAX = 'rangeMax';
    export const INPUTVALUE = 'inputValue';
    export const INPUTRANGEENDVALUE = 'inputRangeEndValue';
    export const INPUTUNIT = 'inputUnit';
    export const MEASUREMENTPOSITION = 'measurementPosition';
    export const MEASUREMENTSCALE = 'measurementScale';
    export const MEASUREMENTCOMMENT = 'measurementComment';
    export const ISIMPRECISE = 'isImprecise';

    export type InputUnit = 'mm'|'cm'|'m'|'mg'|'g'|'kg'|'ml'|'l';
    export type Translations = 'asMeasuredBy'|'measuredWith';

    const VALID_FIELDS = [VALUE, LABEL, ISRANGE, RANGEMIN, RANGEMAX,
        INPUTVALUE, INPUTRANGEENDVALUE, INPUTUNIT, MEASUREMENTPOSITION, MEASUREMENTSCALE, MEASUREMENTCOMMENT,
        ISIMPRECISE];

    export const VALID_INPUT_UNITS = {
        dimension: ['mm', 'cm', 'm'],
        weight: ['mg', 'g', 'kg'],
        volume: ['ml', 'l']
    };


    export function isMeasurement(measurement: any): measurement is Measurement {

        if (!isObject(measurement)) return false;
        for (const fieldName in measurement) {
            if (!VALID_FIELDS.includes(fieldName)) return false;
        }
        if (measurement.measurementPosition && !isString(measurement.measurementPosition)) return false;
        if (measurement.measurementScale && !isString(measurement.measurementScale)) return false;
        if (measurement.measurementComment && !isObject(measurement.measurementComment)
            && !isString(measurement.measurementComment)) {
                return false;
        }
        if (measurement.label) return true; // Support measurements in deprecated format
        if (!measurement.inputUnit || !isString(measurement.inputUnit)) return false;
        if (!isNumber(measurement.inputValue)) return false;
        return true;
    }


    export function isValid(measurement: Measurement, inputType: Field.InputType, options?: any): boolean {

        if (measurement.label) return true; // Support measurements in deprecated format

        if (!measurement.inputValue || !measurement.inputUnit) return false;

        if (!VALID_INPUT_UNITS[inputType]?.includes(measurement.inputUnit)) return false;

        if (measurement.measurementPosition && inputType !== Field.InputType.DIMENSION) return false;
        if (measurement.measurementScale && inputType !== Field.InputType.WEIGHT) return false;

        if (measurement.inputRangeEndValue !== undefined) {
            if (!isNumber(measurement.inputRangeEndValue)) return false;
            if (measurement.inputRangeEndValue === measurement.inputValue) return false;
        }

        if (!options?.permissive) {
            if (measurement.inputValue < 0) return false;
            if (measurement.inputRangeEndValue !== undefined) {
                if (measurement.inputRangeEndValue < 0) return false;
            }
        }

        return true;
    }


    /**
     * Reverts the measurement back to the state before normalization
     * @param measurement gets modified in place
     */
    export function revert(measurement: Measurement) {

        return flow(measurement,
            detach('value'),
            detach('rangeMin'),
            detach('rangeMax'),
            detach('isRange'));
    }


    export function addNormalizedValues(measurement: Measurement) {

        if (measurement.inputRangeEndValue !== undefined) {
            measurement.rangeMin = convertValue(measurement.inputUnit, measurement.inputValue);
            measurement.rangeMax = convertValue(measurement.inputUnit, measurement.inputRangeEndValue);
            delete(measurement.value);
        } else {
            measurement.value = convertValue(measurement.inputUnit, measurement.inputValue);
            delete(measurement.rangeMin);
            delete(measurement.rangeMax);
        }
    }


    export function generateLabel(measurement: Measurement, inputType: Field.InputType,
                                  transform: (value: any) => string|null,
                                  translate: (term: Measurement.Translations) => string,
                                  getFromI18NString: (i18nString: I18N.String|string) => string,
                                  valueLabel?: string): string {

        if (isValid(measurement, inputType)) {
            let label = (measurement.isImprecise ? 'ca. ' : '');
    
            if (measurement.inputRangeEndValue !== undefined) {
                label += transform(measurement.inputValue) + '-'
                    + transform(measurement.inputRangeEndValue);
            } else {
                label += transform(measurement.inputValue);
            }
    
            label += ' ' + measurement.inputUnit;
    
            if (inputType === Field.InputType.DIMENSION && measurement.measurementPosition) {
                label += ', ' + translate('asMeasuredBy') +  ' ' 
                      + (valueLabel ?? measurement.measurementPosition);
            } else if (inputType === Field.InputType.WEIGHT && measurement.measurementScale) {
                label += ', ' + translate('measuredWith') +  ' ' 
                      + (valueLabel ?? measurement.measurementScale);
            }
            if (measurement.measurementComment) {
                label += ' (' + getFromI18NString(measurement.measurementComment) + ')';
            }
            return label;
        } else {
            return JSON.stringify(measurement);
        }
    }


    function convertValue(inputUnit: InputUnit, inputValue: number): number {

        switch (inputUnit) {
            case 'mm':
            case 'mg':
            case 'ml':
                return Math.round(inputValue * 1000);
            case 'cm':
                return Math.round(inputValue * 10000);
            case 'm':
            case 'g':
            case 'l':
                return Math.round(inputValue * 1000000);
            case 'kg':
                return Math.round(inputValue * 1000000000);
            default:
                return inputValue;
        }
    }
}
