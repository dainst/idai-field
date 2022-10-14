import { compose, cond, flatMap, identity, isDefined, reduce, isObject, flow, map, flatten, set,
    isArray } from 'tsfun';
import { I18N } from 'idai-field-core';
import { CsvExportUtils } from './csv-export-utils';
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
                                      i18nStringSubfieldName: string,
                                      expandHeadings: (languages: string[]) => (numItems: number) =>
                                        (fieldName: string) => string[],
                                      expandObject: (languages: string[]) => (where: number, nrOfNewItems: number) =>
                                        (items: any[]) => any[])
            : (columnIndices: number[]) => HeadingsAndMatrix {


        return reduce(([headings, matrix]: HeadingsAndMatrix, columnIndex: number) => {

            const languages: string[] = projectLanguages
                ? getLanguagesFromObjectArray(
                    matrix, projectLanguages, columnIndex, i18nStringSubfieldName
                ) : [];

            const max = Math.max(1, CsvExportUtils.getMax(columnIndex)(matrix));

            const expandedHeader = CsvExportUtils.replaceItem(columnIndex, expandHeadings(languages)(max))(headings);
            const expandedRows = matrix
                .map(expandArray(columnIndex, max))
                .map(expandObject(languages)(columnIndex, max));

            return [expandedHeader, expandedRows];

        }, headingsAndMatrix);
    }


    export function objectExpand(headingsAndMatrix: HeadingsAndMatrix,
                                 expandHeadings: (fieldName: string) => string[],
                                 expandObject: (where: number, nrOfNewItems: number) => (items: any[]) => any[])
            : (columnIndices: number[]) => HeadingsAndMatrix {

        return reduce(([headings, matrix]: HeadingsAndMatrix, columnIndex: number) => {

            const expandedHeader = CsvExportUtils.replaceItem(columnIndex, expandHeadings)(headings);
            const expandedRows = matrix.map(expandObject(columnIndex, 1));

            return [expandedHeader, expandedRows];

        }, headingsAndMatrix);
    }


    export function i18nStringExpand(headingsAndMatrix: HeadingsAndMatrix,
                                     projectLanguages: string[],
                                     expandHeadings: (languages: string[]) => (fieldName: string) => string[],
                                     expandObject: (languages: string[]) => (where: number, nrOfNewItems: number) =>
                                        (items: any[]) => any[])
            : (columnIndices: number[]) => HeadingsAndMatrix {

        return reduce(([headings, matrix]: HeadingsAndMatrix, columnIndex: number) => {

            const languages: string[] = getLanguages(matrix, projectLanguages, columnIndex);
            const expandedHeader = CsvExportUtils.replaceItem(columnIndex, expandHeadings(languages))(headings);
            const expandedRows = matrix.map(expandObject(languages)(columnIndex, 1));

            return [expandedHeader, expandedRows];

        }, headingsAndMatrix);
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
                                         i18nStringSubfieldName?: string): string[] {

        const languages: string[][] = flatten(flow(
            matrix,
            map(row => row[columnIndex]),
            map(field => isArray(field)
                ? field.map(object => i18nStringSubfieldName ? object[i18nStringSubfieldName] : object)
                    .map(i18nString => i18nString ?
                            isObject(i18nString)
                                ? Object.keys(i18nString)
                                : [I18N.UNSPECIFIED_LANGUAGE]
                            : []
                    )
                : [])
        ));

        const result: string[] = set(projectLanguages.concat(flatten(languages)));
        
        return result.length > 0 ? result : [I18N.UNSPECIFIED_LANGUAGE];
    }


    function expandArray(columnIndex: number, widthOfNewItem: number) {

        return CSVExpansion.expandHomogeneousItems(identity, widthOfNewItem)(columnIndex, 1);
    }
}
