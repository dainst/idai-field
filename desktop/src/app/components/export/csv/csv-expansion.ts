import { compose, cond, flatMap, identity, isDefined, reduce, isObject, flow, map, flatten, set, isArray,
    to } from 'tsfun';
import { Field, I18N, Named, Subfield } from 'idai-field-core';
import { CsvFieldIndex, CsvExportUtils } from './csv-export-utils';
import { HeadingsAndMatrix, Matrix } from './csv-export-consts';

const EMPTY = '';


/**
 * @author Daniel de Oliveira
 */
export module CSVExpansion {

    /**
     * as: [A,B,C,D,E]
     * where: 2
     * nrOfNewItems: 2
     * widthOfEachNewItem: 2
     * ->
     * [A,B,R1a,R1b,R2a,R2b,E]
     *
     * computeReplacement should return an array of size widthOfEachNewItem
     */
    export function expandHomogeneousItems(computeReplacement: (removed: any) => any[],
                                           widthOfEachNewItem: number) {

        return <A>(where: number, nrOfNewItems: number): (as: Array<A>) => Array<A> => {

            return CsvExportUtils.replaceItems(
                where,
                nrOfNewItems,
                flatMap(compose(
                    cond(isDefined, computeReplacement, []),
                    CsvExportUtils.fillUpToSize(widthOfEachNewItem, EMPTY)
                ))
            );
        }
    }


    /**
     * Expands headingsAndMatrix at the columns given by columnIndices, assuming that
     * these columns contain array values, which in turn are objects.
     *
     * For example:
     *
     * [['h1', 'h2'],
     *  [[7,   [{b: 2}, {b: 3}],
     *   [8,   [{b: 5}]]]
     *
     * Expanding at index 1, with appropriate expansion functions we can transform into
     *
     * [['h1', 'h2.0.b', 'h2.1.b'],
     *  [[7,   2       , 3],
     *   [8,   5,      , undefined]]]
     */
    export function objectArrayExpand(headingsAndMatrix: HeadingsAndMatrix,
                                      projectLanguages: string[],
                                      fixedI18nStringSubfieldName: string,
                                      expandHeadings: (languages: string[], subfields?: Array<Subfield>) =>
                                        (numItems: number) => (fieldName: string) => string[],
                                      expandObject: (languages: string[], subfields?: Array<Subfield>) =>
                                        (where: number, nrOfNewItems: number) => (items: any[]) => any[])
            : (columnIndices: Array<CsvFieldIndex>) => HeadingsAndMatrix {


        return reduce(([headings, matrix]: HeadingsAndMatrix, columnIndex: CsvFieldIndex) => {

            const subfields: Array<Subfield>|undefined = columnIndex.field.subfields;
            const i18nStringSubfieldNames = getI18NSubfieldNames(subfields, fixedI18nStringSubfieldName);

            const languages: string[] = projectLanguages
                ? getLanguagesFromObjectArray(
                    matrix, projectLanguages, columnIndex.index, i18nStringSubfieldNames
                ) : [];

            const max = Math.max(1, CsvExportUtils.getMax(columnIndex.index)(matrix));

            const expandedHeader = CsvExportUtils.replaceItem(
                columnIndex.index, expandHeadings(languages, subfields)(max)
            )(headings);
            
            const expandedRows = matrix
                .map(expandArray(columnIndex.index, max))
                .map(expandObject(languages, subfields)(columnIndex.index, max));

            return [expandedHeader, expandedRows];

        }, headingsAndMatrix);
    }


    export function objectExpand(headingsAndMatrix: HeadingsAndMatrix,
                                 expandHeadings: (fieldName: string) => string[],
                                 expandObject: (where: number, nrOfNewItems: number) => (items: any[]) => any[])
            : (columnIndices: Array<CsvFieldIndex>) => HeadingsAndMatrix {

        return reduce(([headings, matrix]: HeadingsAndMatrix, columnIndex: CsvFieldIndex) => {

            const expandedHeader = CsvExportUtils.replaceItem(columnIndex.index, expandHeadings)(headings);
            const expandedRows = matrix.map(expandObject(columnIndex.index, 1));

            return [expandedHeader, expandedRows];

        }, headingsAndMatrix);
    }


    export function i18nStringExpand(headingsAndMatrix: HeadingsAndMatrix,
                                     projectLanguages: string[],
                                     expandHeadings: (languages: string[]) => (fieldName: string) => string[],
                                     expandObject: (languages: string[]) => (where: number, nrOfNewItems: number) =>
                                        (items: any[]) => any[])
            : (columnIndices: Array<CsvFieldIndex>) => HeadingsAndMatrix {

        return reduce(([headings, matrix]: HeadingsAndMatrix, columnIndex: CsvFieldIndex) => {

            const languages: string[] = getLanguages(matrix, projectLanguages, columnIndex.index);
            const expandedHeader = CsvExportUtils.replaceItem(columnIndex.index, expandHeadings(languages))(headings);
            const expandedRows = matrix.map(expandObject(languages)(columnIndex.index, 1));

            return [expandedHeader, expandedRows];

        }, headingsAndMatrix);
    }


    function getI18NSubfieldNames(subfields?: Array<Subfield>, fixedI18nSubstringName?: string): string[]|undefined {

        return subfields
            ? subfields.filter(subfield => {
                return Field.InputType.I18N_INPUT_TYPES.includes(subfield.inputType);
            }).map(to(Named.NAME))
            : fixedI18nSubstringName
                ? [fixedI18nSubstringName]
                : undefined;
    }


    function getLanguages(matrix: Matrix, projectLanguages: string[], columnIndex: number): string[] {

        const languages = flow(
            matrix,
            map(row => row[columnIndex]),
            map(field => field ?
                    isObject(field)
                        ? Object.keys(field)
                        : [I18N.UNSPECIFIED_LANGUAGE]
                    : []
            )
        );

        const result: string[] = set(projectLanguages.concat(flatten(languages)));
        
        return result.length > 0 ? result : [I18N.UNSPECIFIED_LANGUAGE];
    }


    function getLanguagesFromObjectArray(matrix: Matrix, projectLanguages: string[], columnIndex: number,
                                         i18nStringSubfieldNames?: string[]): string[] {

        const languages: string[][][] = matrix.map(row => row[columnIndex])
            .map((field: any) => {
                if (!isArray(field)) return [];
                return field.map(object => {
                    if (i18nStringSubfieldNames?.length > 0) {
                        return i18nStringSubfieldNames.reduce((result: string[], subfieldName) => {
                            result = result.concat(getLanguagesFromObject(object[subfieldName]));
                            return result;
                        }, []);
                    } else {
                        return getLanguagesFromObject(object);
                    }
                });
            });

        const result: string[] = set(projectLanguages.concat(flatten(flatten(languages))));
        
        return result.length > 0 ? result : [I18N.UNSPECIFIED_LANGUAGE];
    }


    function getLanguagesFromObject(object: any): string[] {

        return object !== undefined
            ? isObject(object)
                ? Object.keys(object)
                : [I18N.UNSPECIFIED_LANGUAGE]
            : [];
    }


    function expandArray(columnIndex: number, widthOfNewItem: number) {

        return CSVExpansion.expandHomogeneousItems(identity, widthOfNewItem)(columnIndex, 1);
    }
}
