import {compose, cond, flatMap, identity, isDefined, reduce} from 'tsfun';
import {CsvExportUtils} from './csv-export-utils';
import {HeadingsAndMatrix} from './csv-export-consts';
import {fillUpToSize} from '../export-helper';

const EMPTY = '';


/**
 * @author Daniel de Oliveira
 */
export module CSVExpansion {

    /**
     * Takes itms, for example [A,B,C,D,E]
     * and replaces one or more entries by a number of same-structured entries.
     *
     * Lets assume where is 2, nrOfNewItems is 2 and widthOfEachNewitem is 2, then
     * we get
     * [A,B,R1a,R1b,R2a,R2b,E]
     * where the R1 entries replace the C entry
     *   and the R2 entries replace the D enty
     *
     * @param widthOfEachNewItem
     * @param computeReplacement should return an array of size widthOfEachNewItem
     */
    export function expandHomogeneousItems(computeReplacement: (removed: any) => any[],
                                           widthOfEachNewItem: number) {
        /**
         * @param where
         * @param nrOfNewItems
         */
        return (where: number, nrOfNewItems: number) => {

            return CsvExportUtils.replaceItems(
                where,
                nrOfNewItems,
                flatMap(compose(
                    cond(isDefined, computeReplacement, []),
                    fillUpToSize(widthOfEachNewItem, EMPTY))));
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
    export function objectArrayExpand(expandHeadings: (numItems: number) => (fieldName: string) => string[],
                                      expandObject: (where: number, nrOfNewItems: number) => (itms: any[]) => any[],
                                      headingsAndMatrix: HeadingsAndMatrix): (columnIndices: number[]) => HeadingsAndMatrix {

        return reduce(([headings, matrix]: HeadingsAndMatrix, columnIndex: number) => {

            const max = Math.max(1, CsvExportUtils.getMax(columnIndex)(matrix));

            const expandedHeader = CsvExportUtils.replaceItem(columnIndex, expandHeadings(max))(headings);
            const expandedRows   = matrix
                .map(expandArray(columnIndex, max))
                .map(expandObject(columnIndex, max));

            return [expandedHeader, expandedRows];

        }, headingsAndMatrix);
    }


    export function objectExpand(expandHeadings: (fieldName: string) => string[],
                                 expandObject: (where: number, nrOfNewItems: number) => (itms: any[]) => any[],
                                 headingsAndMatrix: HeadingsAndMatrix): (columnIndices: number[]) => HeadingsAndMatrix {

        return reduce(([headings, matrix]: HeadingsAndMatrix, columnIndex: number) => {

            const expandedHeader = CsvExportUtils.replaceItem(columnIndex, expandHeadings)(headings);
            const expandedRows   = matrix.map(expandObject(columnIndex, 1));

            return [expandedHeader, expandedRows];

        }, headingsAndMatrix);
    }


    function expandArray(columnIndex: number, widthOfNewItem: number) {

        return CSVExpansion.expandHomogeneousItems(identity, widthOfNewItem)(columnIndex, 1);
    }
}
