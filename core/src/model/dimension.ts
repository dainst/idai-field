import { flow, detach, isNumber, isObject, isString } from 'tsfun';
import { I18N } from '../tools/i18n';


/**
 * @author Fabian Z.
 * @author Thomas Kleinke
 * @author Daniel de Oliveira 
 */
export interface Dimension {

    // Normalized values (in micrometres), calculated from input values
    //
    // TODO, in order to avoid redundancy in the stored data,
    // instead of saving those to the pouchdb, drop them before saving
    // and when loading from the db into the cache/indexer, drop them as well
    // and recalculate them from inputValue,inputRangeEndValue, inputUnit.
    // Then, for the presentation via iDAI.field Web, calculate those values
    // again during the indexing and mapping process.
    value?: number;
    rangeMin?: number;
    rangeMax?: number;
    //

    // Input values as typed in by the user (in mm/cm/m, defined in inputUnit)
    inputValue: number;
    inputRangeEndValue?: number;
    inputUnit: Dimension.InputUnits;

    measurementPosition?: string;
    measurementComment?: I18N.String|string;
    isImprecise: boolean;

    isRange?: boolean; // Deprecated
    label?: string; // Deprecated
}


export module Dimension {

    export const VALUE = 'value';
    export const LABEL = 'label';
    export const ISRANGE = 'isRange';
    export const RANGEMIN = 'rangeMin';
    export const RANGEMAX = 'rangeMax';
    export const INPUTVALUE = 'inputValue';
    export const INPUTRANGEENDVALUE = 'inputRangeEndValue';
    export const INPUTUNIT = 'inputUnit';
    export const MEASUREMENTPOSITION = 'measurementPosition';
    export const MEASUREMENTCOMMENT = 'measurementComment';
    export const ISIMPRECISE = 'isImprecise';
    export type InputUnits = 'mm'|'cm'|'m'

    export type Translations = 'asMeasuredBy';

    const VALID_FIELDS = [VALUE, LABEL, ISRANGE, RANGEMIN, RANGEMAX,
        INPUTVALUE, INPUTRANGEENDVALUE, INPUTUNIT, MEASUREMENTPOSITION, MEASUREMENTCOMMENT, ISIMPRECISE];

    export const VALID_INPUT_UNITS = ['mm', 'cm', 'm'];


    // This is to replicate behaviour of Dimension.isValid before the change
    // regarding typeguards and valiation
    export function isValid_deprecated(dimension: any) {

        for (const fieldName in dimension) {
            if (!VALID_FIELDS.includes(fieldName)) return false;
        }
        if (dimension.label) return true;
        return false;
    }


    export function isDimension(dimension: any): dimension is Dimension {

        if (!isObject(dimension)) return false;
        for (const fieldName in dimension) {
            if (!VALID_FIELDS.includes(fieldName)) return false;
        }
        if (dimension.measurementPosition && !isString(dimension.measurementPosition)) return false;
        if (dimension.measurementComment && !isObject(dimension.measurementComment)
            && !isString(dimension.measurementComment)) {
                return false;
        }
        if (!VALID_INPUT_UNITS.includes(dimension.inputUnit)) return false;
        if (!isNumber(dimension.inputValue)) return false;
        return true;
    }


    /**
     * Note: There still may be dimension['isRange'] boolean values stored in the database.
     * These should be handled properly if we're up to changing things here, for example if
     * we want to make sure only defined fields are present.
     *
     * @param dimension
     * @param options
     */
    export function isValid(dimension: Dimension, options?: any) {

        if (!dimension.inputValue || !dimension.inputUnit) return false;

        if (dimension.inputRangeEndValue !== undefined) {
            if (!isNumber(dimension.inputRangeEndValue)) return false;
            if (dimension.inputRangeEndValue === dimension.inputValue) return false;
        }

        if (!options?.permissive) {
            if (dimension.inputValue < 0) return false;
            if (dimension.inputRangeEndValue !== undefined) {
                if (dimension.inputRangeEndValue < 0) return false;
            }
        }

        return true;
    }


    /**
     * Reverts the dimension back to the state before normalization
     * @param dimension gets modified in place
     */
    export function revert(dimension: Dimension) {

        return flow(dimension,
            detach('value'),
            detach('rangeMin'),
            detach('rangeMax'),
            detach('isRange'));
    }


    export function addNormalizedValues(dimension: Dimension) {

        if (dimension.inputRangeEndValue !== undefined) {
            dimension.rangeMin = convertValueFromInputUnitToMicrometre(dimension.inputUnit,
                dimension.inputValue);
            dimension.rangeMax = convertValueFromInputUnitToMicrometre(dimension.inputUnit,
                dimension.inputRangeEndValue);
            delete(dimension.value);
        } else {
            dimension.value = convertValueFromInputUnitToMicrometre(dimension.inputUnit,
                dimension.inputValue);
            delete(dimension.rangeMin);
            delete(dimension.rangeMax);
        }
    }


    export function generateLabel(dimension: Dimension,
                                  transform: (value: any) => string|null,
                                  translate: (term: Dimension.Translations) => string,
                                  getFromI18NString: (i18nString: I18N.String|string) => string,
                                  measurementPositionLabel?: string): string {

        if (isValid(dimension)) {
            let label = (dimension.isImprecise ? 'ca. ' : '');
    
            if (dimension.inputRangeEndValue !== undefined) {
                label += transform(dimension.inputValue) + '-'
                    + transform(dimension.inputRangeEndValue);
            } else {
                label += transform(dimension.inputValue);
            }
    
            label += ' ' + dimension.inputUnit;
    
            if (dimension.measurementPosition) {
                label += ', ' + translate('asMeasuredBy') +  ' ' 
                      + (measurementPositionLabel 
                        ? measurementPositionLabel 
                        : dimension.measurementPosition);
            }
            if (dimension.measurementComment) label += ' (' + getFromI18NString(dimension.measurementComment) + ')';
            return label;
        } else {
            return JSON.stringify(dimension);
        }
    }


    function convertValueFromInputUnitToMicrometre(inputUnit: InputUnits,
                                                   inputValue: number): number {

        switch (inputUnit) {
            case 'mm':
                return inputValue * 1000;
            case 'cm':
                return inputValue * 10000;
            case 'm':
                return inputValue * 1000000;
            default:
                return inputValue;
        }
    }
}
