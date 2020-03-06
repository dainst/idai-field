import {compose, flatMap, flow, identity, includedIn, isDefined, isNot,
    isnt, reduce, reverse, to, cond, left, right, Pair, dense, prepend} from 'tsfun';
import {Dating, Dimension, FieldResource, Resource, ValOptionalEndVal} from 'idai-components-2';
import {clone} from '../../util/object-util';
import {fillUpToSize} from '../export-helper';
import {HierarchicalRelations} from '../../model/relation-constants';
import {FieldDefinition} from '../../configuration/model/field-definition';
import {CsvExportUtils} from './csv-export-utils';
import {CsvHeadingsExpansion} from './csv-headings-expansion';
import {CsvExportConsts} from './csv-export-consts';
import replaceItems = CsvExportUtils.replaceItems;
import replaceItem = CsvExportUtils.replaceItem;


/**
 * @author Daniel de Oliveira
 */
export module CSVExport {

    import OBJECT_SEPARATOR = CsvExportConsts.OBJECT_SEPARATOR;
    const EMPTY = '';
    const SEPARATOR = ',';
    export const ARRAY_SEPARATOR = ';';

    const RELATIONS_IS_RECORDED_IN = 'relations.isRecordedIn';
    const RELATIONS_IS_CHILD_OF = 'relations.isChildOf';
    const RELATIONS_LIES_WITHIN = 'relations.liesWithin';

    const DIMENSION = 'dimension';

    const H = left;
    const M = right;
    type Cell = string;
    type Matrix = Cell[][];
    type Heading = string;
    type Headings = Heading[];
    type HeadingsAndMatrix = Pair<Headings, Matrix>;


    /**
     * Creates a header line and lines for each record.
     * If resources is empty, still a header line gets created.
     *
     * @param resources
     * @param fieldDefinitions
     * @param relations
     */
    export function createExportable(resources: Array<FieldResource>,
                                     fieldDefinitions: Array<FieldDefinition>,
                                     relations: Array<string>) {

        const headings: string[] = makeHeadings(fieldDefinitions, relations);
        const matrix = resources
            .map(toDocumentWithFlattenedRelations)
            .map(toRowsArrangedBy(headings));

        return flow([headings, matrix],
            expandValOptionalEndVal(fieldDefinitions),
            expandDating,
            expandDimension(fieldDefinitions),
            combine);
    }


    function combine(headingsAndMatrix: HeadingsAndMatrix) {

        return [H(headingsAndMatrix)].concat(M(headingsAndMatrix)).map(toCsvLine);
    }


    const expandDatingItems = expandHomogeneousItems(rowsWithDatingElementsExpanded, 9);

    const expandDimensionItems = expandHomogeneousItems(rowsWithDimensionElementsExpanded, 6);

    const expandValOptionalEndValItems = expandHomogeneousItems(rowsWitValOptionalEndValElementsExpanded, 2);


    const expandLevelOne =
        (columnIndex: number, widthOfNewItem: number) => expandHomogeneousItems(identity, widthOfNewItem)(columnIndex, 1);


    function expandValOptionalEndVal(fieldDefinitions: Array<FieldDefinition>) {

        return (headingsAndMatrix: HeadingsAndMatrix) => {

            return flow(
                headingsAndMatrix,
                left,
                CsvExportUtils.getIndices(fieldDefinitions, 'dropdownRange'),
                reverse,
                objectExpand(
                    CsvHeadingsExpansion.expandValOptionalEndValHeadings,
                    expandValOptionalEndValItems,
                    headingsAndMatrix));
        }
    }



    function expandDating(headingsAndMatrix: HeadingsAndMatrix) {

        const indexOfDatingElement = H(headingsAndMatrix).indexOf('dating');
        if (indexOfDatingElement === -1) return headingsAndMatrix;

        return objectArrayExpand(
            CsvHeadingsExpansion.expandDatingHeadings,
            expandDatingItems,
            headingsAndMatrix)([indexOfDatingElement]);
    }


    function expandDimension(fieldDefinitions: Array<FieldDefinition>) {

        return (headings_and_matrix: HeadingsAndMatrix) => {

            return flow(
                headings_and_matrix,
                left,
                CsvExportUtils.getIndices(fieldDefinitions, DIMENSION),
                reverse,
                objectArrayExpand(
                    CsvHeadingsExpansion.expandDimensionHeadings,
                    expandDimensionItems,
                    headings_and_matrix));
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
    function objectArrayExpand(expandHeadings: (numItems: number) => (fieldName: string) => string[],
                               expandLevelTwo: (where: number, nrOfNewItems: number) => (itms: any[]) => any[],
                               headingsAndMatrix: HeadingsAndMatrix): (columnIndices: number[]) => HeadingsAndMatrix {

        return reduce(([headings, matrix]: HeadingsAndMatrix, columnIndex: number) => {

                const max = Math.max(1, CsvExportUtils.getMax(columnIndex)(matrix));

                const expandedHeader = replaceItem(columnIndex, expandHeadings(max))(headings);
                const expandedRows   = matrix
                    .map(expandLevelOne(columnIndex, max))
                    .map(expandLevelTwo(columnIndex, max));

                return [expandedHeader, expandedRows];

            }, headingsAndMatrix);
    }


    function objectExpand(expandHeadings: (fieldName: string) => string[],
                          expandLevelTwo: (where: number, nrOfNewItems: number) => (itms: any[]) => any[],
                          headingsAndMatrix: HeadingsAndMatrix): (columnIndices: number[]) => HeadingsAndMatrix {

        return reduce(([headings, matrix]: HeadingsAndMatrix, columnIndex: number) => {

            const expandedHeader = replaceItem(columnIndex, expandHeadings)(headings);
            const expandedRows   = matrix.map(expandLevelTwo(columnIndex, 1));
            return [expandedHeader, expandedRows];

        }, headingsAndMatrix);
    }


    function makeHeadings(fieldDefinitions: Array<FieldDefinition>, relations: string[]) {

        return makeFieldNamesList(fieldDefinitions)
            .concat(
                relations
                    .filter(isNot(includedIn(HierarchicalRelations.ALL)))
                    .map(prepend(Resource.RELATIONS + OBJECT_SEPARATOR)))
            .concat(relations.find(includedIn(HierarchicalRelations.ALL)) ? [RELATIONS_IS_CHILD_OF] : []);
    }


    function rowsWithDatingElementsExpanded(dating: Dating): string[] {

        const {type, begin, end, margin, source, isImprecise, isUncertain} = dating;

        const expandedDating = [
            type ? type : '',
            begin && begin.inputType ? begin.inputType : '',
            begin && begin.inputYear ? begin.inputYear.toString() : '',
            end && end.inputType ? end.inputType : '',
            end && end.inputYear ? end.inputYear.toString() : '',
            margin ? margin.toString() : '',
            source ? source : ''];

        if (isImprecise !== undefined) expandedDating.push(isImprecise ? 'true' : 'false');
        if (isUncertain !== undefined) expandedDating.push(isUncertain ? 'true' : 'false');

        return expandedDating;
    }


    function rowsWitValOptionalEndValElementsExpanded(valOptionalEndVal: ValOptionalEndVal<string>): string[] {

        const {value, endValue} = valOptionalEndVal;
        return [value, endValue ? endValue : ''];
    }


    function rowsWithDimensionElementsExpanded(dimension: Dimension): string[] {

        const {inputValue, inputRangeEndValue, measurementPosition, measurementComment,
            inputUnit, isImprecise} = dimension;

        const expandedDimension = [
            inputValue ? inputValue.toString() : '',
            inputRangeEndValue ? inputRangeEndValue.toString() : '',
            measurementPosition ? measurementPosition : '',
            measurementComment ? measurementComment : '',
            inputUnit ? inputUnit : ''];

        if (isImprecise !== undefined) expandedDimension.push(isImprecise ? 'true' : 'false');

        return expandedDimension;
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
                flatMap(compose(
                    cond(isDefined, computeReplacement, []),
                    fillUpToSize(widthOfEachNewItem, EMPTY))));
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


    function toRowsArrangedBy(headings: Heading[]) { return (resource: FieldResource) => {

        const row = dense(headings.length);

        return getUsableFieldNames(Object.keys(resource))
            .reduce((row, fieldName) => {

                const indexOfFoundElement = headings.indexOf(fieldName);
                if (indexOfFoundElement !== -1) row[indexOfFoundElement] = (resource as any)[fieldName];

                return row;
            }, row);
    }}


    function makeFieldNamesList(fieldDefinitions: Array<FieldDefinition>): string[] {

        let fieldNames: string[] = getUsableFieldNames(fieldDefinitions.map(to('name')));
        const indexOfShortDescription = fieldNames.indexOf(FieldResource.SHORTDESCRIPTION);
        if (indexOfShortDescription !== -1) {
            fieldNames.splice(indexOfShortDescription, 1);
            fieldNames.unshift(FieldResource.SHORTDESCRIPTION);
        }
        fieldNames = fieldNames.filter(isnt(FieldResource.IDENTIFIER));
        fieldNames.unshift(FieldResource.IDENTIFIER);

        return fieldNames;
    }


    function getUsableFieldNames(fieldNames: string[]): string[] {

        return fieldNames.filter(isNot(includedIn(
            ['id', 'type', 'geometry', 'georeference', 'originalFilename', 'filename']
        )));
    }


    function toCsvLine(fields: string[]): string {

        const wrapContents  = (field: string) => '"' + getFieldValue(field) + '"';
        return fields
            .map(cond(isDefined, wrapContents, '""'))
            .join(SEPARATOR);
    }


    function getFieldValue(field: any): string {

        const value: string = Array.isArray(field)
            ? field.join(ARRAY_SEPARATOR)
            : field + '';   // Convert numbers to strings

        return value.replace(new RegExp('"', 'g'), '""');
    }
}