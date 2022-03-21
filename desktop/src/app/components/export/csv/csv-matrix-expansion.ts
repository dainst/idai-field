import { flow, left, reverse } from 'tsfun';
import { Dating, Dimension, Literature, OptionalRange, Field } from 'idai-field-core';
import { CSVExpansion } from './csv-expansion';
import { HeadingsAndMatrix } from './csv-export-consts';
import { CsvExportUtils } from './csv-export-utils';
import { CSVHeadingsExpansion } from './csv-headings-expansion';


/**
 * @author Daniel de Oliveira
 */
export module CSVMatrixExpansion {

    const expandDimensionItems = CSVExpansion.expandHomogeneousItems(rowsWithDimensionElementsExpanded, 6);
    const expandOptionalRangeItems = CSVExpansion.expandHomogeneousItems(rowsWithOptionalRangeElementsExpanded, 2);
    const expandDatingItems = CSVExpansion.expandHomogeneousItems(rowsWithDatingElementsExpanded, 9);
    const expandLiteratureItems = CSVExpansion.expandHomogeneousItems(rowsWithLiteratureElementsExpanded, 5);


    export function expandOptionalRangeVal(fieldDefinitions: Array<Field>) {

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


    export function expandDating(fieldDefinitions: Array<Field>) {

        return (headingsAndMatrix: HeadingsAndMatrix) => {

            return flow(
                headingsAndMatrix,
                left,
                CsvExportUtils.getIndices(fieldDefinitions, Field.InputType.DATING),
                reverse,
                CSVExpansion.objectArrayExpand(
                    headingsAndMatrix,
                    CSVHeadingsExpansion.expandDatingHeadings,
                    expandDatingItems
                )
            );
        }
    }


    export function expandDimension(fieldDefinitions: Array<Field>) {

        return (headingsAndMatrix: HeadingsAndMatrix) => {

            return flow(
                headingsAndMatrix,
                left,
                CsvExportUtils.getIndices(fieldDefinitions, Field.InputType.DIMENSION),
                reverse,
                CSVExpansion.objectArrayExpand(
                    headingsAndMatrix,
                    CSVHeadingsExpansion.expandDimensionHeadings,
                    expandDimensionItems
                )
            );
        }
    }


    export function expandLiterature(fieldDefinitions: Array<Field>) {

        return (headingsAndMatrix: HeadingsAndMatrix) => {

            return flow(
                headingsAndMatrix,
                left,
                CsvExportUtils.getIndices(fieldDefinitions, Field.InputType.LITERATURE),
                reverse,
                CSVExpansion.objectArrayExpand(
                    headingsAndMatrix,
                    CSVHeadingsExpansion.expandLiteratureHeadings,
                    expandLiteratureItems
                )
            );
        }
    }


    function rowsWithDatingElementsExpanded(dating: Dating): string[] {

        const { type, begin, end, margin, source, isImprecise, isUncertain } = dating;

        const expandedDating = [
            type ? type : '',
            begin?.inputType ?? '',
            begin?.inputYear ? begin.inputYear.toString() : '',
            end?.inputType ?? '',
            end?.inputYear ? end.inputYear.toString() : '', // TODO improve condition, should not only be truthy, but defined
            margin ? margin.toString() : '',
            source ? source : ''
        ];

        if (isImprecise !== undefined) expandedDating.push(isImprecise ? 'true' : 'false');
        if (isUncertain !== undefined) expandedDating.push(isUncertain ? 'true' : 'false');

        return expandedDating;
    }


    function rowsWithOptionalRangeElementsExpanded(optionalRange: OptionalRange<string>): string[] {

        const { value, endValue } = optionalRange;
        return [value, endValue ? endValue : ''];
    }


    function rowsWithDimensionElementsExpanded(dimension: Dimension): string[] {

        const { inputValue, inputRangeEndValue, measurementPosition, measurementComment,
            inputUnit, isImprecise } = dimension;

        const expandedDimension = [
            (inputValue !== undefined && inputValue !== null) ? inputValue.toString() : '',
            (inputRangeEndValue !== undefined && inputRangeEndValue !== null) ? inputRangeEndValue.toString() : '',
            measurementPosition ?? '',
            measurementComment ?? '',
            inputUnit ?? ''
        ];

        if (isImprecise !== undefined) expandedDimension.push(isImprecise ? 'true' : 'false');

        return expandedDimension;
    }


    function rowsWithLiteratureElementsExpanded(literature: Literature): string[] {

        const { quotation, zenonId, doi, page, figure } = literature;

        const expandedLiterature = [
            quotation ?? '',
            zenonId ?? '',
            doi ?? '',
            page ?? '',
            figure ?? ''
        ];

        return expandedLiterature;
    }
}
