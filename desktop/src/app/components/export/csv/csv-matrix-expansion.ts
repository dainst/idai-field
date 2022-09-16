import { flow, left, reverse, isString } from 'tsfun';
import { Dating, Dimension, Literature, OptionalRange, Field, I18N } from 'idai-field-core';
import { CSVExpansion } from './csv-expansion';
import { HeadingsAndMatrix } from './csv-export-consts';
import { CsvExportUtils } from './csv-export-utils';
import { CSVHeadingsExpansion } from './csv-headings-expansion';


/**
 * @author Daniel de Oliveira
 */
export module CSVMatrixExpansion {

    const expandI18nStrings = (languages: string[]) => CSVExpansion.expandHomogeneousItems(
        rowsWithI18nStringExpanded(languages), languages.length
    );
    const expandDimensionItems = (languages: string[]) => CSVExpansion.expandHomogeneousItems(
        rowsWithDimensionElementsExpanded(languages), 5 + languages.length
    );
    const expandDatingItems = (languages: string[]) => CSVExpansion.expandHomogeneousItems(
        rowsWithDatingElementsExpanded(languages), 8 + languages.length
    );
    const expandLiteratureItems = (_: string[]) => CSVExpansion.expandHomogeneousItems(
        rowsWithLiteratureElementsExpanded, 5
    );
    const expandOptionalRangeItems = CSVExpansion.expandHomogeneousItems(rowsWithOptionalRangeElementsExpanded, 2);


    export function expandI18nString(fieldDefinitions: Array<Field>, projectLanguages: string[], inputType: Field.InputType) {

        return (headingsAndMatrix: HeadingsAndMatrix) => {

            return flow(
                headingsAndMatrix,
                left,
                CsvExportUtils.getIndices(fieldDefinitions, inputType),
                reverse,
                CSVExpansion.i18nStringExpand(
                    headingsAndMatrix,
                    projectLanguages,
                    CSVHeadingsExpansion.expandI18nStringHeadings,
                    expandI18nStrings
                )
            );
        }
    }


    export function expandI18nStringArray(fieldDefinitions: Array<Field>, projectLanguages: string[]) {

        return (headingsAndMatrix: HeadingsAndMatrix) => {

            return flow(
                headingsAndMatrix,
                left,
                CsvExportUtils.getIndices(fieldDefinitions, Field.InputType.MULTIINPUT),
                reverse,
                CSVExpansion.objectArrayExpand(
                    headingsAndMatrix,
                    projectLanguages,
                    undefined,
                    CSVHeadingsExpansion.expandI18nStringArrayHeadings,
                    expandI18nStrings
                )
            );
        }
    }


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


    export function expandDating(fieldDefinitions: Array<Field>, projectLanguages: string[]) {

        return (headingsAndMatrix: HeadingsAndMatrix) => {

            return flow(
                headingsAndMatrix,
                left,
                CsvExportUtils.getIndices(fieldDefinitions, Field.InputType.DATING),
                reverse,
                CSVExpansion.objectArrayExpand(
                    headingsAndMatrix,
                    projectLanguages,
                    Dating.SOURCE,
                    CSVHeadingsExpansion.expandDatingHeadings,
                    expandDatingItems
                )
            );
        }
    }


    export function expandDimension(fieldDefinitions: Array<Field>, projectLanguages: string[]) {

        return (headingsAndMatrix: HeadingsAndMatrix) => {

            return flow(
                headingsAndMatrix,
                left,
                CsvExportUtils.getIndices(fieldDefinitions, Field.InputType.DIMENSION),
                reverse,
                CSVExpansion.objectArrayExpand(
                    headingsAndMatrix,
                    projectLanguages,
                    Dimension.MEASUREMENTCOMMENT,
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
                    undefined,
                    undefined,
                    CSVHeadingsExpansion.expandLiteratureHeadings,
                    expandLiteratureItems
                )
            );
        }
    }


    function rowsWithI18nStringExpanded(languages: string[]) {

        return (i18nString: I18N.String|string): string[] => {

            return languages.map(language => {
                return isString(i18nString)
                    ? (language === I18N.UNSPECIFIED_LANGUAGE ? i18nString : '')
                    : (i18nString[language] ?? '');
            });
        };
    }


    function rowsWithDatingElementsExpanded(languages: string[]) {
        
        return (dating: Dating): string[] => {

            const { type, begin, end, margin, source, isImprecise, isUncertain } = dating;

            const expandedDating = [
                type ? type : '',
                begin?.inputType ?? '',
                begin?.inputYear ? begin.inputYear.toString() : '',
                end?.inputType ?? '',
                end?.inputYear ? end.inputYear.toString() : '', // TODO improve condition, should not only be truthy, but defined
                margin ? margin.toString() : ''
            ].concat(source
                ? rowsWithI18nStringExpanded(languages)(source)
                : languages.map(_ => '')
            );

            if (isImprecise !== undefined) expandedDating.push(isImprecise ? 'true' : 'false');
            if (isUncertain !== undefined) expandedDating.push(isUncertain ? 'true' : 'false');

            return expandedDating;
        }
    }


    function rowsWithOptionalRangeElementsExpanded(optionalRange: OptionalRange<string>): string[] {

        const { value, endValue } = optionalRange;
        return [value, endValue ? endValue : ''];
    }


    function rowsWithDimensionElementsExpanded(languages: string[]) {
        
        return (dimension: Dimension): string[] => {

            const { inputValue, inputRangeEndValue, measurementPosition, measurementComment,
                inputUnit, isImprecise } = dimension;

            const expandedDimension = [
                (inputValue !== undefined && inputValue !== null) ? inputValue.toString() : '',
                (inputRangeEndValue !== undefined && inputRangeEndValue !== null) ? inputRangeEndValue.toString() : '',
                measurementPosition ?? ''
            ].concat(measurementComment
                ? rowsWithI18nStringExpanded(languages)(measurementComment)
                : languages.map(_ => '')
            ).concat([
                inputUnit ?? ''
            ]);

            if (isImprecise !== undefined) expandedDimension.push(isImprecise ? 'true' : 'false');

            return expandedDimension as string[];
        }
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
