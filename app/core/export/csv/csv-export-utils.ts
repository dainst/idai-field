import {drop, flow, indices, is, on, reduce, take} from 'tsfun';
import {FieldDefinition} from '../../configuration/model/field-definition';
import {FieldResource, Resource} from 'idai-components-2';
import {clone} from '../../util/object-util';
import {CsvExportConsts} from './csv-export-consts';
import RELATIONS_LIES_WITHIN = CsvExportConsts.RELATIONS_LIES_WITHIN;
import RELATIONS_IS_CHILD_OF = CsvExportConsts.RELATIONS_IS_CHILD_OF;
import RELATIONS_IS_RECORDED_IN = CsvExportConsts.RELATIONS_IS_RECORDED_IN;
import ARRAY_SEPARATOR = CsvExportConsts.ARRAY_SEPARATOR;
import OBJECT_SEPARATOR = CsvExportConsts.OBJECT_SEPARATOR;


/**
 * @author Daniel de Oliveira
 */
export module CsvExportUtils {

    /**
     * fieldDefinitions: [
     *   {name: 'a1', inputType: 'a-i'},
     *   {name: 'a2', inputType: 'a-i'},
     *   {name: 'b', inputType: 'b-i'}
     * ]
     * inputType: 'a-i'
     * headings: ['b', a1', 'a2']
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


    /**
     * matrix: [
     *   ['a', 'b', [{}, {}], 'e'],
     *   ['a', 'b', [{}, {}, {}]],
     *   ['a', 'c', [{}], 'd']
     * ]
     * columnIndex: 2
     * ->
     * 3
     */
    export function getMax(columnIndex: number)
        : <A>(matrix: any) => number{

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
                                    replace: (_: Array<A>) => Array<A>) {

        return (as: Array<A>): Array<A> => {

            const replacements =
                flow(as,
                    drop(where),
                    take(nrOfNewItems),
                    replace);

            return take(where)(as)
                .concat(replacements)
                .concat(drop(where + nrOfNewItems)(as));
        }
    }


    export function replaceItem<A>(where: number,
                                   replace: (_: A) => Array<A>)
            : (as: Array<A>) => Array<A> {

        return replaceItems(where, 1,
            (items: any[]) =>
                items.length === 0
                    ? []
                    : replace(items[0]));
    }


    /**
     * resource.relations = { someRel: ['val1', 'val2] }
     * ->
     * resource['relations.someRel'] = 'val1; val2'
     *
     * @param resource
     * @returns a new resource instance, where relations are turned into fields.
     */
    export function convertToResourceWithFlattenedRelations(resource: FieldResource): FieldResource {

        const cloned = clone(resource); // so we can modify in place

        if (!cloned.relations) return cloned;
        for (let relation of Object.keys(cloned.relations)) {
            cloned[Resource.RELATIONS + OBJECT_SEPARATOR + relation]
                = cloned.relations[relation].join(ARRAY_SEPARATOR);
        }
        delete cloned.relations;

        if (cloned[RELATIONS_LIES_WITHIN]) {
            delete cloned[RELATIONS_IS_RECORDED_IN];
            cloned[RELATIONS_IS_CHILD_OF] = cloned[RELATIONS_LIES_WITHIN];
        }
        else if (cloned[RELATIONS_IS_RECORDED_IN]) {
            cloned[RELATIONS_IS_CHILD_OF] = cloned[RELATIONS_IS_RECORDED_IN];
            delete cloned[RELATIONS_IS_RECORDED_IN];
        }

        return cloned;
    }
}
