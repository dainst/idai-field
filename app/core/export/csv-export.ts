import {FieldResource, IdaiType, FieldDefinition} from 'idai-components-2';
import {includedIn, isNot, isnt, to, identity, reverse, indices, on, is} from 'tsfun';
import {clone} from '../util/object-util';
import {HIERARCHICAL_RELATIONS} from '../../c';


/**
 * @author Daniel de Oliveira
 */
export module CSVExport {

    const SEP = ',';
    const OBJ_SEP = '.';
    const REL_SEP = ';';
    const BOGUS = 'tmpval';

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

        let matrix = resources
            .map(toDocumentWithFlattenedRelations)
            .map(toRowsArrangedBy(headings));

        const indexOfDatingElement = headings.indexOf('dating');
        if (indexOfDatingElement !== -1) expand(
            [indexOfDatingElement],
            expandHeader(headings, getInsertableDatingItems),
            rowsWithDatingElementsExpanded,
            matrix);

        expand(
            getIndices(headings, resourceType.fields, 'dimension'),
            expandHeader(headings, getInsertableDimensionItems),
            rowsWithDimensionElementsExpanded,
            matrix);

        return ([headings].concat(matrix)).map(toCsvLine);
    }


    function getIndices(headings: string[], fieldDefinitions: Array<FieldDefinition>, inputType: string) {

        return indices((heading: string) => {

                if (heading.includes(OBJ_SEP)) return false;
               const field = fieldDefinitions.find(on('name', is(heading)));
               if (!field) return false;

               return (field.inputType === inputType);

            })(headings);
    }


    /**
     * @param indices in increasing order
     * @param headerExpansion
     * @param rowsExpansion
     * @param matrix
     */
    function expand(indices: number[], headerExpansion: Function, rowsExpansion: Function, matrix: any) {

        for (let index of reverse(indices)) {

            const max = getMax(matrix, index);
            if (isNaN(max)) continue; // TODO review

            headerExpansion(index, max);

            matrix = matrix // TODO, weird that this reassignment seems to work. review and perhaps return it as return value
                .map(expandArrayToSize(index, max))
                .map(rowsExpansion(index, max))
        }
    }


    function getMax(matrix: any, indexOfDatingElement: any) {

        return matrix.reduce((max: number, row: any) =>

                Math.max(
                    max,
                    row[indexOfDatingElement]
                        ? row[indexOfDatingElement].length
                        : 0)

            , 0);
    }


    function makeHeadings(resourceType: IdaiType, relations: Array<string>) {

        return makeFieldNamesList(resourceType)
            .concat(
                relations
                    .filter(isNot(includedIn(HIERARCHICAL_RELATIONS)))
                    .map(relation => 'relations.' + relation))
            .concat(['relations.isChildOf']);
    }


    /**
     * @param fieldNames gets modified in place
     * @param replaceFunction
     */
    function expandHeader(fieldNames: any, replaceFunction: Function) {

        return (indexOfElementToReplace: number, max: number) => {

            const fieldsToInsert: string[] = [];
            for (let i = 0; i < max; i++) fieldsToInsert.push(BOGUS);
            const fieldName = fieldNames.splice(indexOfElementToReplace, 1, ...fieldsToInsert);

            for (let i = max - 1; i >= 0; i--) {

                const indexOfCurrentElement = indexOfElementToReplace + i;
                fieldNames.splice(indexOfCurrentElement, 1, replaceFunction(fieldName, i));
            }
        }
    }


    function getInsertableDatingItems(fieldName: string, i: number) {

        return [
            fieldName + OBJ_SEP + i + '.begin.year',
            fieldName + OBJ_SEP + i + '.end.year',
            fieldName + OBJ_SEP + i + '.source',
            fieldName + OBJ_SEP + i + '.label'];
    }


    function getInsertableDimensionItems(fieldName: string, i: number) {

        return [
            fieldName + OBJ_SEP + i + '.value',
            fieldName + OBJ_SEP + i + '.inputValue',
            fieldName + OBJ_SEP + i + '.inputRangeEndValue',
            fieldName + OBJ_SEP + i + '.measurementPosition',
            fieldName + OBJ_SEP + i + '.measurementComment',
            fieldName + OBJ_SEP + i + '.inputUnit',
            fieldName + OBJ_SEP + i + '.isImprecise',
            fieldName + OBJ_SEP + i + '.isRange',
            fieldName + OBJ_SEP + i + '.label',
            fieldName + OBJ_SEP + i + '.rangeMin',
            fieldName + OBJ_SEP + i + '.rangeMax'];
    }


    function rowsWithDatingElementsExpanded(indexOfDatingElement: number, max: number) {

        return expandHomogeneousItems(indexOfDatingElement, max, 4,
            (removed: any) => {

                return [
                    removed['begin'] && removed['begin']['year'] ? removed['begin']['year'] : undefined,
                    removed['end'] && removed['end']['year'] ? removed['end']['year'] : undefined,
                    removed['source'],
                    removed['label']];
            });
    }


    function rowsWithDimensionElementsExpanded(indexOfDimensionElement: number, max: number) {

        return expandHomogeneousItems(indexOfDimensionElement, max, 11,
            (removed: any) => {

                return [
                    removed['value'],
                    removed['inputValue'],
                    removed['inputRangeEndValue'],
                    removed['measurementPosition'],
                    removed['measurementComment'],
                    removed['inputUnit'],
                    removed['isImprecise'],
                    removed['isRange'],
                    removed['label'],
                    removed['rangeMin'],
                    removed['rangeMax']];
            });
    }


    function expandArrayToSize(where: number, targetSize: number) {

        return expandHomogeneousItems(where, 1, targetSize, identity);
    }


    function expandHomogeneousItems(where: number, nrOfNewItems: number, widthOfEachNewItem: number,
                    computeReplacement: (removed: any) => any[]) {

        return (itms: any[]) => {

            for (let i = nrOfNewItems - 1; i >= 0; i--) {

                const removed = itms.splice(where + i, 1, ...Array(widthOfEachNewItem))[0];
                if (removed) {
                    const newEls = computeReplacement(removed);
                    for (let j = 0; j < newEls.length; j++) itms[where + i + j] = newEls[j];
                }
            }

            return itms;
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

        const RELATIONS_IS_RECORDED_IN = 'relations.isRecordedIn';
        const RELATIONS_IS_CHILD_OF = 'relations.isChildOf';
        const RELATIONS_LIES_WITHIN = 'relations.liesWithin';

        const cloned = clone(resource); // so we can modify in place

        if (!cloned.relations) return cloned;
        for (let relation of Object.keys(cloned.relations)) {
            cloned['relations.' + relation] = cloned.relations[relation].join(REL_SEP);
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


    function toRowsArrangedBy(fieldNames: string[]) {

        return (resource: FieldResource) => {

            const newRow = new Array(fieldNames.length);

            return getUsableFieldNames(Object.keys(resource))
                .reduce((row, fieldName) =>  {

                    const indexOfFoundElement = fieldNames.indexOf(fieldName);
                    if (indexOfFoundElement !== -1) {

                        row[indexOfFoundElement] = (resource as any)[fieldName];
                    }
                    return row;
                }, newRow);
        }
    }


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


    const toCsvLine = (as: string[]): string => as.join(SEP);
}