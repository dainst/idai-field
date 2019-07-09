import {DecimalPipe} from '@angular/common';
import {Dimension} from 'idai-components-2';


/**
 * @author Fabian Z.
 * @author Thomas Kleinke
 */
export module DimensionUtil {

    export function generateLabel(dimension: Dimension, decimalPipe: DecimalPipe): string {

        let label = (dimension.isImprecise ? 'ca. ' : '');

        if (dimension.isRange) {
            label += decimalPipe.transform(dimension.inputValue) + '-'
                + decimalPipe.transform(dimension.inputRangeEndValue);
        } else {
            label += decimalPipe.transform(dimension.inputValue);
        }

        label += ' ' + dimension.inputUnit;

        if (dimension.measurementPosition) label += ', Gemessen an ' + dimension.measurementPosition;
        if (dimension.measurementComment) label += ' (' + dimension.measurementComment + ')';

        return label;
    }
}