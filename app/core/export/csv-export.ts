import {FieldDefinition, FieldResource, IdaiType, Dating, Dimension} from 'idai-components-2';
import {drop, identity, includedIn, indices, is, isNot, isnt, on, reduce, take, reverse,
    to, flow, compose, flatMap, isDefined, arrayList, when, range} from 'tsfun';
import {clone} from '../util/object-util';
import {HIERARCHICAL_RELATIONS} from '../../c';
import {fillUpToSize} from './export-helper';


/**
 * @author Daniel de Oliveira
 */
export module CSVExport {

    const EMPTY = '';
    const SEPARATOR = ',';
    const OBJECT_SEPARATOR = '.';
    const ARRAY_SEPARATOR = ';';

    const RELATIONS_IS_RECORDED_IN = 'relations.isRecordedIn';
    const RELATIONS_IS_CHILD_OF = 'relations.isChildOf';
    const RELATIONS_LIES_WITHIN = 'relations.liesWithin';

    const H = 0;
    const M = 1;
    type HeadingsAndMatrix = [string[],string[][]];


    /**
     * Creates a header line and lines for each record.
     * If resources is empty, still a header line gets created.
     *
     * @param resources
     * @param resourceType
     * @param relations
     */
    export function createExportable(resources: FieldResource[],
                                     resourceType: IdaiType,
                                     relations: Array<string>) {

        const headings: string[] = makeHeadings(resourceType, relations);
        const matrix = resources
            .map(toDocumentWithFlattenedRelations)
            .map(toRowsArrangedBy(headings));

        return flow<any>([headings, matrix],
            expandDating,
            expandDimension(resourceType.fields),
            combine);
    }


    function combine(headings_and_matrix: HeadingsAndMatrix) {

        return [headings_and_matrix[H]].concat(headings_and_matrix[M]).map(toCsvLine);
    }


    const expandDatingItems = expandHomogeneousItems(rowsWithDatingElementsExpanded, 9);

    const expandDimensionItems = expandHomogeneousItems(rowsWithDimensionElementsExpanded, 7);

    const expandLevelOne =
        (columnIndex: number, widthOfNewItem: number) => expandHomogeneousItems(identity, widthOfNewItem)(columnIndex, 1);


    function expandDating(headings_and_matrix: HeadingsAndMatrix) {

        const indexOfDatingElement = headings_and_matrix[H].indexOf('dating');
        if (indexOfDatingElement === -1) return headings_and_matrix;

        return expand(
            expandDatingHeadings,
            expandDatingItems,
            headings_and_matrix)([indexOfDatingElement])
    }


    function expandDimension(fieldDefinitions: Array<FieldDefinition>) {

        const getDimensionIndices = getIndices(fieldDefinitions, 'dimension');

        return (headings_and_matrix: HeadingsAndMatrix) => {

            const dimensionIndices = reverse(getDimensionIndices(headings_and_matrix[H]));

            return expand(
                    expandDimensionHeadings,
                    expandDimensionItems,
                    headings_and_matrix
                )(dimensionIndices);
        }
    }


    function getIndices(fieldDefinitions: Array<FieldDefinition>, inputType: string) {

        return indices((heading: string) => {

                if (heading.includes(OBJECT_SEPARATOR)) return false;
                const field = fieldDefinitions.find(on('name', is(heading)));
                if (!field) return false;

                return field.inputType === inputType;
            });
    }


    /**
     * Returns a function that when provided an array of columnIndices,
     * expands headings_and_matrix at the columns, assuming that
     * these columns contain array values.
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
     *
     * @param expandHeading
     * @param expandLevelTwo
     * @param headings_and_matrix
     */
    function expand(expandHeading: Function,
                    expandLevelTwo: Function,
                    headings_and_matrix: HeadingsAndMatrix) {

        return reduce((headings_and_matrix: HeadingsAndMatrix, columnIndex: number) => {

                const max = Math.max(1, getMax(columnIndex)(headings_and_matrix[M]));

                return [
                    replaceItems(columnIndex, 1, expandHeading(max))(headings_and_matrix[H]),
                    headings_and_matrix[M]
                        .map(expandLevelOne(columnIndex, max))
                        .map(expandLevelTwo(columnIndex, max))];

            }, headings_and_matrix);
    }


    function getMax(columnIndex: any) {

        return reduce((max: number, row: any) =>

                Math.max(
                    max,
                    row[columnIndex]
                        ? row[columnIndex].length
                        : 0)

            , 0);
    }


    function makeHeadings(resourceType: IdaiType, relations: Array<string>) {

        return makeHeadingsWithExpandedDropdownRange(resourceType)
            .concat(
                relations
                    .filter(isNot(includedIn(HIERARCHICAL_RELATIONS)))
                    .map(relation => 'relations.' + relation))
            .concat([RELATIONS_IS_CHILD_OF]);
    }


    function makeHeadingsWithExpandedDropdownRange(resourceType: IdaiType) {

        const fieldNamesList= makeFieldNamesList(resourceType);
        const dropdownRangeIndices = getIndices(resourceType.fields, 'dropdownRange')(fieldNamesList);

        return reverse(dropdownRangeIndices)
            .reduce(
                (fieldNamesList, index) => replaceItem(index, name => [name, name + 'End'])(fieldNamesList) as string[],
                fieldNamesList);
    }


    function expandDatingHeadings(n: number) { return (fieldName: string) => {

        return flatMap<any>((i: number) => [
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'type',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'begin.inputType',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'begin.inputYear',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'end.inputType',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'end.inputYear',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'margin',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'source',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'isImprecise',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'isUncertain']
            )(range(n));
    }}


    function expandDimensionHeadings(n:number) { return (fieldName: string) => {

        return flatMap<any>((i: number) => [
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'inputValue',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'inputRangeEndValue',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'measurementPosition',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'measurementComment',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'inputUnit',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'isImprecise',
                fieldName + OBJECT_SEPARATOR + i + OBJECT_SEPARATOR + 'isRange']
            )(range(n));
    }}


    function rowsWithDatingElementsExpanded(dating: Dating): string[] {

        const {type, begin, end, margin, source, isImprecise, isUncertain} = dating;

        return [
            type ? type : '',
            begin && begin.inputType ? begin.inputType : '',
            begin && begin.inputYear ? begin.inputYear.toString() : '',
            end && end.inputType ? end.inputType : '',
            end && end.inputYear ? end.inputYear.toString() : '',
            margin ? margin.toString() : '',
            source ? source : '',
            isImprecise ? 'true' : 'false',
            isUncertain ? 'true' : 'false'];
    }


    function rowsWithDimensionElementsExpanded(dimension: Dimension): string[] {

        const {inputValue, inputRangeEndValue, measurementPosition, measurementComment,
            inputUnit, isImprecise, isRange} = dimension;

        return [
            inputValue ? inputValue.toString() : '',
            inputRangeEndValue ? inputRangeEndValue.toString() : '',
            measurementPosition ? measurementPosition : '',
            measurementComment ? measurementComment : '',
            inputUnit ? inputUnit : '',
            isImprecise ? 'true' : 'false',
            isRange ? 'true' : 'false'];
    }


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
    function expandHomogeneousItems(computeReplacement: (removed: any) => any[],
                                    widthOfEachNewItem: number) {
        /**
         * @param where
         * @param nrOfNewItems
         */
        return (where: number, nrOfNewItems: number) => {

            return replaceItems(
                where,
                nrOfNewItems,
                flatMap(compose<any>(
                    when(isDefined, computeReplacement, []),
                    fillTo(widthOfEachNewItem))));
        }
    }


    function replaceItem<A>(where: number,
                            replace: (_: A) => A[]) {

        return replaceItems(where, 1,
            (items: any[]) =>
                items.length === 0
                    ? []
                    : replace(items[0]));
    }

    function replaceItems<A>(where: number,
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


    /**
     * resource.relations = { someRel: ['val1', 'val2] }
     * ->
     * resource['relations.someRel'] = 'val1; val2'
     *
     * @param resource
     * @returns a new resource instance, where relations are turned into fields.
     */
    function toDocumentWithFlattenedRelations(resource: FieldResource): FieldResource {

        const cloned = clone(resource); // so we can modify in place

        if (!cloned.relations) return cloned;
        for (let relation of Object.keys(cloned.relations)) {
            cloned['relations.' + relation] = cloned.relations[relation].join(ARRAY_SEPARATOR);
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


    function toRowsArrangedBy(fieldNames: string[]) { return (resource: FieldResource) => {

        const row = arrayList(fieldNames.length);

        return getUsableFieldNames(Object.keys(resource))
            .reduce((row, fieldName) => {

                const indexOfFoundElement = fieldNames.indexOf(fieldName);
                if (indexOfFoundElement !== -1) row[indexOfFoundElement] = (resource as any)[fieldName];

                return row;
            }, row);
    }}


    function makeFieldNamesList(resourceType: IdaiType) {

        let fieldNames: string[] = getUsableFieldNames(resourceType.fields.map(to('name')));
        const indexOfShortDescription = fieldNames.indexOf('shortDescription');
        if (indexOfShortDescription !== -1) {
            fieldNames.splice(indexOfShortDescription, 1);
            fieldNames.unshift('shortDescription');
        }
        fieldNames = fieldNames.filter(isnt('identifier'));
        fieldNames.unshift('identifier');
        return fieldNames;
    }


    function getUsableFieldNames(fieldNames: string[]): string[] {

        return fieldNames
            .filter(isnt('type'))
            .filter(isnt('geometry'))
            .filter(isnt('id'));
    }


    function fillTo(targetSize: number) {

        /**
         * @param items may be undefined
         */
        return (items: any[]|undefined) => fillUpToSize(targetSize, EMPTY)(items ? items : [])
    }


    function toCsvLine(as: string[]): string {

        return as.map(field => field ? '"' + getFieldValue(field) + '"' : '""').join(SEPARATOR);
    }


    function getFieldValue(field: any): string {

        const value: string = Array.isArray(field) ? field.join(ARRAY_SEPARATOR) : field;
        return value.replace(new RegExp('"', 'g'), '""');
    }
}