import {drop, flow, indices, is, on, reduce, take} from 'tsfun';
import {FieldDefinition} from '../configuration/model/field-definition';


export module CsvExportUtils {

    const OBJECT_SEPARATOR = '.';

    /**
     * fieldDefinitions = [
     *   {name: 'a1', inputType: 'a-i'},
     *   {name: 'a2', inputType: 'a-i'},
     *   {name: 'b', inputType: 'b-i'}
     * ]
     * inputType = 'a-i'
     * headings = ['b', a1', 'a2']
     * ->
     * [1, 2]
     */
    export function getIndices(fieldDefinitions: Array<FieldDefinition>, inputType: string)
        : (headings: string[]) => number[] {

        return indices((heading: string) => {

            if (heading.includes(OBJECT_SEPARATOR)) return false;
            const field = fieldDefinitions.find(on(FieldDefinition.NAME, is(heading)));
            if (!field) return false;

            return field.inputType === inputType;
        });
    }


    export function getMax(columnIndex: any) {

        return reduce((max: number, row: any) =>

                Math.max(
                    max,
                    row[columnIndex]
                        ? row[columnIndex].length
                        : 0)

            , 0);
    }


    export function replaceItems<A>(where: number,
                                    nrOfNewItems: number,
                                    replace: (_: A[]) => A[]) {

        /**
         * @param itms
         */
        return (itms: A[]) => {

            const replacements =
                flow(itms,
                    drop(where),
                    take(nrOfNewItems),
                    replace);

            return take(where)(itms)
                .concat(replacements)
                .concat(drop(where + nrOfNewItems)(itms));
        }
    }


    export function replaceItem<A>(where: number,
                                   replace: (_: A) => A[]) {

        return replaceItems(where, 1,
            (items: any[]) =>
                items.length === 0
                    ? []
                    : replace(items[0]));
    }
}
