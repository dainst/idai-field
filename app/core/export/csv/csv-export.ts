import {flow, includedIn, isDefined, isNot,
    isnt, reverse, to, cond, left, dense, prepend} from 'tsfun';
import {Dating, Dimension, FieldResource, Resource, ValOptionalEndVal} from 'idai-components-2';
import {clone} from '../../util/object-util';
import {HierarchicalRelations} from '../../model/relation-constants';
import {FieldDefinition} from '../../configuration/model/field-definition';
import {CsvExportUtils} from './csv-export-utils';
import {CSVHeadingsExpansion} from './csv-headings-expansion';
import {CsvExportConsts, H, Heading, HeadingsAndMatrix, M} from './csv-export-consts';
import {CSVExpansion} from './csv-expansion';


/**
 * @author Daniel de Oliveira
 */
export module CSVExport {

    import OBJECT_SEPARATOR = CsvExportConsts.OBJECT_SEPARATOR;

    const SEPARATOR = ',';
    export const ARRAY_SEPARATOR = ';';

    const RELATIONS_IS_RECORDED_IN = 'relations.isRecordedIn';
    const RELATIONS_IS_CHILD_OF = 'relations.isChildOf';
    const RELATIONS_LIES_WITHIN = 'relations.liesWithin';

    const DIMENSION = 'dimension';


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


    function combine([headings, matrix]: HeadingsAndMatrix) {

        return [headings].concat(matrix).map(toCsvLine);
    }


    const expandDatingItems = CSVExpansion.expandHomogeneousItems(rowsWithDatingElementsExpanded, 9);

    const expandDimensionItems = CSVExpansion.expandHomogeneousItems(rowsWithDimensionElementsExpanded, 6);

    const expandValOptionalEndValItems = CSVExpansion.expandHomogeneousItems(rowsWitValOptionalEndValElementsExpanded, 2);


    function expandValOptionalEndVal(fieldDefinitions: Array<FieldDefinition>) {

        return (headingsAndMatrix: HeadingsAndMatrix) => {

            return flow(
                headingsAndMatrix,
                left,
                CsvExportUtils.getIndices(fieldDefinitions, 'dropdownRange'),
                reverse,
                CSVExpansion.objectExpand(
                    CSVHeadingsExpansion.expandValOptionalEndValHeadings,
                    expandValOptionalEndValItems,
                    headingsAndMatrix));
        }
    }



    function expandDating(headingsAndMatrix: HeadingsAndMatrix) {

        const indexOfDatingElement = H(headingsAndMatrix).indexOf('dating');
        if (indexOfDatingElement === -1) return headingsAndMatrix;

        return CSVExpansion.objectArrayExpand(
            CSVHeadingsExpansion.expandDatingHeadings,
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
                CSVExpansion.objectArrayExpand(
                    CSVHeadingsExpansion.expandDimensionHeadings,
                    expandDimensionItems,
                    headings_and_matrix));
        }
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


    function toRowsArrangedBy(headings: Heading[]) {

        return (resource: FieldResource) => {

            return getUsableFieldNames(Object.keys(resource))
                .reduce((row, fieldName) => {

                    const indexOfFoundElement = headings.indexOf(fieldName);
                    if (indexOfFoundElement !== -1) row[indexOfFoundElement] = (resource as any)[fieldName];

                    return row;

                }, dense(headings.length));
        }
    }


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