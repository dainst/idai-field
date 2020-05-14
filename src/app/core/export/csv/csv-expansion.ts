import {compose, cond, flatMap, identity, isDefined, reduce} from 'tsfun';
import {CsvExportUtils} from './csv-export-utils';
import {HeadingsAndMatrix} from './csv-export-consts';

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
                    CsvExportUtils.fillUpToSize(widthOfEachNewItem, EMPTY))));
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
                                      expandHeadings: (numItems: number) => (fieldName: string) => string[],
                                      expandObject: (where: number, nrOfNewItems: number) => (itms: any[]) => any[])
            : (columnIndices: number[]) => HeadingsAndMatrix {

        return reduce(([headings, matrix]: HeadingsAndMatrix, columnIndex: number) => {

            const max = Math.max(1, CsvExportUtils.getMax(columnIndex)(matrix));

            const expandedHeader = CsvExportUtils.replaceItem(columnIndex, expandHeadings(max))(headings);
            const expandedRows   = matrix
                .map(expandArray(columnIndex, max))
                .map(expandObject(columnIndex, max));

            return [expandedHeader, expandedRows];

        }, headingsAndMatrix);
    }


    export function objectExpand(headingsAndMatrix: HeadingsAndMatrix,
                                 expandHeadings: (fieldName: string) => string[],
                                 expandObject: (where: number, nrOfNewItems: number) => (itms: any[]) => any[])
            : (columnIndices: number[]) => HeadingsAndMatrix {

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
