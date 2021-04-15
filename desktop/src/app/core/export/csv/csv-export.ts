import {flow, includedIn, isDefined, isNot, isnt, map, cond,
    dense, compose, remove} from 'tsfun';
import {Resource} from 'idai-field-core';
import {FieldResource, StringUtils, Relations, FieldDefinition} from 'idai-field-core';
import {CSVMatrixExpansion} from './csv-matrix-expansion';
import {CsvExportUtils} from './csv-export-utils';
import {CsvExportConsts, Heading, HeadingsAndMatrix} from './csv-export-consts';
import OBJECT_SEPARATOR = CsvExportConsts.OBJECT_SEPARATOR;
import RELATIONS_IS_CHILD_OF = CsvExportConsts.RELATIONS_IS_CHILD_OF;
import ARRAY_SEPARATOR = CsvExportConsts.ARRAY_SEPARATOR;


/**
 * @author Daniel de Oliveira
 */
export module CSVExport {

    const SEPARATOR = ',';

    const getUsableFieldNames =
        remove(includedIn(
            ['id', 'category', 'geometry', 'georeference', 'originalFilename', 'filename', 'featureVectors']));

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
            .map(CsvExportUtils.convertToResourceWithFlattenedRelations)
            .map(toRowsArrangedBy(headings));

        return flow([headings, matrix],
            CSVMatrixExpansion.expandOptionalRangeVal(fieldDefinitions),
            CSVMatrixExpansion.expandDating,
            CSVMatrixExpansion.expandDimension(fieldDefinitions),
            CSVMatrixExpansion.expandLiterature,
            combine);
    }


    function combine([headings, matrix]: HeadingsAndMatrix) {

        return [headings].concat(matrix).map(toCsvLine);
    }


    function makeHeadings(fieldDefinitions: Array<FieldDefinition>, relations: string[]) {

        return extractExportableFields(fieldDefinitions)
            .concat(
                relations
                    .filter(isNot(includedIn(Relations.Hierarchy.ALL)))
                    .map(s => Resource.RELATIONS + OBJECT_SEPARATOR + s))
            .concat(relations.find(includedIn(Relations.Hierarchy.ALL)) ? [RELATIONS_IS_CHILD_OF] : []);
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


    function extractExportableFields(fieldDefinitions: Array<FieldDefinition>): string[] {

        let fieldNames = getUsableFieldNames(fieldDefinitions.map(_ => _.name));
        const indexOfShortDescription = fieldNames.indexOf(FieldResource.SHORTDESCRIPTION);
        if (indexOfShortDescription !== -1) {
            fieldNames.splice(indexOfShortDescription, 1);
            fieldNames.unshift(FieldResource.SHORTDESCRIPTION);
        }
        fieldNames = fieldNames.filter(isnt(FieldResource.IDENTIFIER));
        fieldNames.unshift(FieldResource.IDENTIFIER);

        return fieldNames;
    }


    function toCsvLine(fields: string[]): string {

        return flow(
            fields,
            map(
                cond(isDefined,
                    compose(getFieldValue,
                        StringUtils.append('"'),
                        StringUtils.prepend('"')),
                    '""')),
            StringUtils.join(SEPARATOR));
    }


    function getFieldValue(field: any): string {

        const value: string = Array.isArray(field)
            ? field.join(ARRAY_SEPARATOR)
            : field + '';   // Convert numbers to strings

        return value.replace(new RegExp('"', 'g'), '""');
    }
}
