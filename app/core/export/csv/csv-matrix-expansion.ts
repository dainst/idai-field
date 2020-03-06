import {CSVExpansion} from './csv-expansion';
import {FieldDefinition} from '../../configuration/model/field-definition';
import {H, HeadingsAndMatrix} from './csv-export-consts';
import {flow, left, reverse} from 'tsfun';
import {CsvExportUtils} from './csv-export-utils';
import {CSVHeadingsExpansion} from './csv-headings-expansion';
import {Dating, Dimension, ValOptionalEndVal} from 'idai-components-2/index';


/**
 * @author Daniel de Oliveira
 */
export module CSVMatrixExpansion {

    const DIMENSION = 'dimension';

    const expandDimensionItems = CSVExpansion.expandHomogeneousItems(rowsWithDimensionElementsExpanded, 6);

    const expandValOptionalEndValItems = CSVExpansion.expandHomogeneousItems(rowsWitValOptionalEndValElementsExpanded, 2);

    const expandDatingItems = CSVExpansion.expandHomogeneousItems(rowsWithDatingElementsExpanded, 9);


    export function expandValOptionalEndVal(fieldDefinitions: Array<FieldDefinition>) {

        return (headingsAndMatrix: HeadingsAndMatrix) => {

            return flow(
                headingsAndMatrix,
                left,
                CsvExportUtils.getIndices(fieldDefinitions, 'dropdownRange'),
                reverse,
                CSVExpansion.objectExpand(
                    headingsAndMatrix,
                    CSVHeadingsExpansion.expandValOptionalEndValHeadings,
                    expandValOptionalEndValItems));
        }
    }


    export function expandDating(headingsAndMatrix: HeadingsAndMatrix) {

        const indexOfDatingElement = H(headingsAndMatrix).indexOf('dating');
        if (indexOfDatingElement === -1) return headingsAndMatrix;

        return CSVExpansion.objectArrayExpand(
            headingsAndMatrix,
            CSVHeadingsExpansion.expandDatingHeadings,
            expandDatingItems)([indexOfDatingElement]);
    }


    export function expandDimension(fieldDefinitions: Array<FieldDefinition>) {

        return (headings_and_matrix: HeadingsAndMatrix) => {

            return flow(
                headings_and_matrix,
                left,
                CsvExportUtils.getIndices(fieldDefinitions, DIMENSION),
                reverse,
                CSVExpansion.objectArrayExpand(
                    headings_and_matrix,
                    CSVHeadingsExpansion.expandDimensionHeadings,
                    expandDimensionItems));
        }
    }


    function rowsWithDatingElementsExpanded(dating: Dating): string[] {

        const {type, begin, end, margin, source, isImprecise, isUncertain} = dating;

        const expandedDating = [
            type ? type : '',
            begin && begin.inputType ? begin.inputType : '',
            begin && begin.inputYear ? begin.inputYear.toString() : '',
            end && end.inputType ? end.inputType : '',
            end && end.inputYear ? end.inputYear.toString() : '',
            margin ? margin.toString() : '',
            source ? source : ''];

        if (isImprecise !== undefined) expandedDating.push(isImprecise ? 'true' : 'false');
        if (isUncertain !== undefined) expandedDating.push(isUncertain ? 'true' : 'false');

        return expandedDating;
    }


    function rowsWitValOptionalEndValElementsExpanded(valOptionalEndVal: ValOptionalEndVal<string>): string[] {

        const {value, endValue} = valOptionalEndVal;
        return [value, endValue ? endValue : ''];
    }


    function rowsWithDimensionElementsExpanded(dimension: Dimension): string[] {

        const {inputValue, inputRangeEndValue, measurementPosition, measurementComment,
            inputUnit, isImprecise} = dimension;

        const expandedDimension = [
            inputValue ? inputValue.toString() : '',
            inputRangeEndValue ? inputRangeEndValue.toString() : '',
            measurementPosition ? measurementPosition : '',
            measurementComment ? measurementComment : '',
            inputUnit ? inputUnit : ''];

        if (isImprecise !== undefined) expandedDimension.push(isImprecise ? 'true' : 'false');

        return expandedDimension;
    }
}