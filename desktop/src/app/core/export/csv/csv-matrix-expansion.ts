import {flow, left, reverse} from 'tsfun';
import {Dating, Dimension, Literature, OptionalRange} from 'idai-field-core';
import {CSVExpansion} from './csv-expansion';
import {FieldDefinition} from 'idai-field-core';
import {H, HeadingsAndMatrix} from './csv-export-consts';
import {CsvExportUtils} from './csv-export-utils';
import {CSVHeadingsExpansion} from './csv-headings-expansion';


/**
 * @author Daniel de Oliveira
 */
export module CSVMatrixExpansion {

    const DIMENSION = 'dimension';

    const expandDimensionItems = CSVExpansion.expandHomogeneousItems(rowsWithDimensionElementsExpanded, 6);

    const expandOptionalRangeItems = CSVExpansion.expandHomogeneousItems(rowsWithOptionalRangeElementsExpanded, 2);

    const expandDatingItems = CSVExpansion.expandHomogeneousItems(rowsWithDatingElementsExpanded, 9);

    const expandLiteratureItems = CSVExpansion.expandHomogeneousItems(rowsWithLiteratureElementsExpanded, 2);


    export function expandOptionalRangeVal(fieldDefinitions: Array<FieldDefinition>) {

        return (headingsAndMatrix: HeadingsAndMatrix) => {

            return flow(
                headingsAndMatrix,
                left,
                CsvExportUtils.getIndices(fieldDefinitions, 'dropdownRange'),
                reverse,
                CSVExpansion.objectExpand(
                    headingsAndMatrix,
                    CSVHeadingsExpansion.expandOptionalRangeHeadings,
                    expandOptionalRangeItems
                )
            );
        }
    }


    export function expandDating(headingsAndMatrix: HeadingsAndMatrix) {

        const indexOfDatingElement = H(headingsAndMatrix).indexOf('dating');
        if (indexOfDatingElement === -1) return headingsAndMatrix;

        return CSVExpansion.objectArrayExpand(
            headingsAndMatrix,
            CSVHeadingsExpansion.expandDatingHeadings,
            expandDatingItems)([indexOfDatingElement]
        );
    }


    export function expandDimension(fieldDefinitions: Array<FieldDefinition>) {

        return (headingsAndMatrix: HeadingsAndMatrix) => {

            return flow(
                headingsAndMatrix,
                left,
                CsvExportUtils.getIndices(fieldDefinitions, DIMENSION),
                reverse,
                CSVExpansion.objectArrayExpand(
                    headingsAndMatrix,
                    CSVHeadingsExpansion.expandDimensionHeadings,
                    expandDimensionItems
                )
            );
        }
    }


    export function expandLiterature(headingsAndMatrix: HeadingsAndMatrix) {

        const indexOfDatingElement = H(headingsAndMatrix).indexOf('literature');
        if (indexOfDatingElement === -1) return headingsAndMatrix;

        return CSVExpansion.objectArrayExpand(
            headingsAndMatrix,
            CSVHeadingsExpansion.expandLiteratureHeadings,
            expandLiteratureItems)([indexOfDatingElement]
        );
    }


    function rowsWithDatingElementsExpanded(dating: Dating): string[] {

        const { type, begin, end, margin, source, isImprecise, isUncertain } = dating;

        const expandedDating = [
            type ? type : '',
            begin && begin.inputType ? begin.inputType : '',
            begin && begin.inputYear ? begin.inputYear.toString() : '',
            end && end.inputType ? end.inputType : '',
            end && end.inputYear ? end.inputYear.toString() : '', // TODO improve condition, should not only be truthy, but defined
            margin ? margin.toString() : '',
            source ? source : ''
        ];

        if (isImprecise !== undefined) expandedDating.push(isImprecise ? 'true' : 'false');
        if (isUncertain !== undefined) expandedDating.push(isUncertain ? 'true' : 'false');

        return expandedDating;
    }


    function rowsWithOptionalRangeElementsExpanded(valOptionalEndVal: OptionalRange<string>): string[] {

        const { value, endValue } = valOptionalEndVal;
        return [value, endValue ? endValue : ''];
    }


    function rowsWithDimensionElementsExpanded(dimension: Dimension): string[] {

        const { inputValue, inputRangeEndValue, measurementPosition, measurementComment,
            inputUnit, isImprecise } = dimension;

        const expandedDimension = [
            (inputValue !== undefined && inputValue !== null) ? inputValue.toString() : '',
            (inputRangeEndValue !== undefined && inputRangeEndValue !== null) ? inputRangeEndValue.toString() : '',
            measurementPosition ? measurementPosition : '',
            measurementComment ? measurementComment : '',
            inputUnit ? inputUnit : ''
        ];

        if (isImprecise !== undefined) expandedDimension.push(isImprecise ? 'true' : 'false');

        return expandedDimension;
    }


    function rowsWithLiteratureElementsExpanded(literature: Literature): string[] {

        const { quotation, zenonId } = literature;

        const expandedLiterature = [
            quotation ? quotation : '',
            zenonId ? zenonId : '',
        ];

        return expandedLiterature;
    }
}
