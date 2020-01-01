import {flow, dissoc} from 'tsfun';
import {Dimension} from 'idai-components-2';


/**
 * @author Fabian Z.
 * @author Thomas Kleinke
 */
export module DimensionUtil { // TODO merge this with dimension.ts in idai-components-2


    export function isValid(dimension: Dimension): boolean {

        if (dimension.label) return true;
        if (!dimension.inputValue || !dimension.inputUnit) return false;

        return typeof(dimension.inputValue) === 'number'
            && (!dimension.inputRangeEndValue || typeof(dimension.inputRangeEndValue) === 'number');
    }


    /**
     * Reverts the dimension back to the state before normalization
     *
     * @param dimension gets modified in place
     * @author Daniel de Oliveira
     */
    export function revert(dimension: Dimension) {

        return flow(dimension,
            dissoc('value'),
            dissoc('rangeMin'),
            dissoc('rangeMax'));
    }


    export function addNormalizedValues(dimension: Dimension) {

        if (dimension.isRange) {
            dimension.rangeMin = convertValueFromInputUnitToMicrometre(dimension.inputUnit,
                dimension.inputValue);
            dimension.rangeMax = convertValueFromInputUnitToMicrometre(dimension.inputUnit,
                dimension.inputRangeEndValue);
            delete(dimension.value);
        } else {
            dimension.value = convertValueFromInputUnitToMicrometre(dimension.inputUnit,
                dimension.inputValue);
        }
    }


    export function generateLabel(dimension: Dimension,
                                  transform: (value: any) => string|null,
                                  getTranslation: (key: string) => string): string {

        let label = (dimension.isImprecise ? 'ca. ' : '');

        if (dimension.isRange) {
            label += transform(dimension.inputValue) + '-'
                + transform(dimension.inputRangeEndValue);
        } else {
            label += transform(dimension.inputValue);
        }

        label += ' ' + dimension.inputUnit;

        if (dimension.measurementPosition) {
            label += ', ' + getTranslation('asMeasuredBy') +  ' '
                + dimension.measurementPosition;
        }
        if (dimension.measurementComment) label += ' (' + dimension.measurementComment + ')';

        return label;
    }


    function convertValueFromInputUnitToMicrometre(inputUnit: 'mm'|'cm'|'m',
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