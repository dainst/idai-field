import { flow, includedIn, isDefined, isNot, isnt, map, cond, dense, compose, remove, on, is } from 'tsfun';
import { Resource, FieldResource, StringUtils, Relation, Field, ImageResource } from 'idai-field-core';
import { CSVMatrixExpansion } from './csv-matrix-expansion';
import { CsvExportUtils } from './csv-export-utils';
import { CsvExportConsts, Heading, Headings, HeadingsAndMatrix, Matrix } from './csv-export-consts';
import OBJECT_SEPARATOR = CsvExportConsts.OBJECT_SEPARATOR;
import RELATIONS_IS_CHILD_OF = CsvExportConsts.RELATIONS_IS_CHILD_OF;
import ARRAY_SEPARATOR = CsvExportConsts.ARRAY_SEPARATOR;


const FIELD_NAMES_TO_REMOVE = [Resource.ID, Resource.CATEGORY, FieldResource.GEOMETRY, ImageResource.GEOREFERENCE,
    ImageResource.ORIGINAL_FILENAME, 'filename', 'featureVectors'];


export type CSVExportResult = {
    csvData: string[];
    invalidFields: Array<InvalidField>;
};


export type InvalidField = {
    identifier: string;
    fieldName: string;
};


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module CSVExport {

    const SEPARATOR = ',';


    /**
     * Creates a header line and lines for each record.
     * If resources is empty, still a header line gets created.
     *
     * @param resources
     * @param fieldDefinitions
     * @param relations
     */
    export function createExportable(resources: Array<FieldResource>,
                                     fieldDefinitions: Array<Field>,
                                     relations: Array<string>,
                                     projectLanguages: string[],
                                     combineHierarchicalRelations: boolean = true,
                                     addScanCode: boolean = false) {

        fieldDefinitions = fieldDefinitions.filter(field => field.inputType !== Field.InputType.RELATION);

        const headings: string[] = makeHeadings(fieldDefinitions, relations, combineHierarchicalRelations, addScanCode);
        const matrix = resources
            .map(CsvExportUtils.convertToResourceWithFlattenedRelations(combineHierarchicalRelations))
            .map(toRowsArrangedBy(headings, addScanCode));

        const invalidFields: Array<InvalidField> = removeInvalidFieldData(
            headings, matrix, fieldDefinitions
        );

        const csvData: string[] = flow(
            [headings, matrix],
            CSVMatrixExpansion.expandI18nString(fieldDefinitions, projectLanguages, Field.InputType.INPUT),
            CSVMatrixExpansion.expandI18nString(fieldDefinitions, projectLanguages, Field.InputType.TEXT),
            CSVMatrixExpansion.expandI18nStringArray(fieldDefinitions, projectLanguages),
            CSVMatrixExpansion.expandOptionalRangeVal(fieldDefinitions),
            CSVMatrixExpansion.expandDating(fieldDefinitions, projectLanguages),
            CSVMatrixExpansion.expandDimension(fieldDefinitions, projectLanguages),
            CSVMatrixExpansion.expandLiterature(fieldDefinitions),
            CSVMatrixExpansion.expandComposite(fieldDefinitions, projectLanguages),
            combine
        );

        return { csvData, invalidFields };
    }


    function combine([headings, matrix]: HeadingsAndMatrix) {

        return [headings].concat(matrix).map(toCsvLine);
    }


    function makeHeadings(fieldDefinitions: Array<Field>, relations: string[],
                          combineHierarchicalRelations: boolean, addScanCode: boolean) {

        const exportableFields: string[] = extractExportableFields(fieldDefinitions, addScanCode);

        return combineHierarchicalRelations
            ? exportableFields.concat(relations.filter(isNot(includedIn(Relation.Hierarchy.ALL)))
                    .map(s => Resource.RELATIONS + OBJECT_SEPARATOR + s))
                .concat(relations.find(includedIn(Relation.Hierarchy.ALL)) ? [RELATIONS_IS_CHILD_OF] : [])
            : exportableFields.concat(relations.map(s => Resource.RELATIONS + OBJECT_SEPARATOR + s));
    }


    function toRowsArrangedBy(headings: Heading[], addScanCode: boolean) {

        return (resource: FieldResource) => {

            return getUsableFieldNames(Object.keys(resource), addScanCode)
                .reduce((row, fieldName) => {

                    const indexOfFoundElement = headings.indexOf(fieldName);
                    if (indexOfFoundElement !== -1) {
                        row[indexOfFoundElement] = (resource as any)[fieldName];
                    }

                    return row;
                }, dense(headings.length));
        }
    }


    function removeInvalidFieldData(headings: Headings, matrix: Matrix,
                                    fieldDefinitions: Array<Field>): Array<InvalidField> {

        const invalidFields: Array<InvalidField> = [];
        const identifierIndex: number = headings.indexOf(Resource.IDENTIFIER);

        headings.forEach((heading, index) => {
            const field: Field = fieldDefinitions.find(on(Field.NAME, is(heading)));
            if (!field) return;

            matrix.filter(row => {
                return row[index] !== undefined && !Field.isValidFieldData(row[index], field);
            }).forEach(row => {
                delete row[index];
                invalidFields.push({ identifier: row[identifierIndex], fieldName: field.name });
            });
        });

        return invalidFields;
    }


    function extractExportableFields(fieldDefinitions: Array<Field>, addScanCode: boolean): string[] {

        let fieldNames = fieldDefinitions.map(fieldDefinition => fieldDefinition.name);
        fieldNames = getUsableFieldNames(fieldNames, addScanCode);

        const indexOfShortDescription = fieldNames.indexOf(FieldResource.SHORTDESCRIPTION);
        if (indexOfShortDescription !== -1) {
            fieldNames.splice(indexOfShortDescription, 1);
            fieldNames.unshift(FieldResource.SHORTDESCRIPTION);
        }

        fieldNames = fieldNames.filter(isnt(Resource.IDENTIFIER));
        fieldNames.unshift(Resource.IDENTIFIER);

        return fieldNames;
    }


    function getUsableFieldNames(fieldNames: string[], addScanCode: boolean): string[] {

        if (addScanCode) fieldNames = fieldNames.concat([FieldResource.SCANCODE]);
        return remove(includedIn(FIELD_NAMES_TO_REMOVE))(fieldNames);
    }


    function toCsvLine(fields: string[]): string {

        return flow(
            fields,
            map(
                cond(
                    isDefined,
                        compose(
                            getFieldValue,
                            StringUtils.append('"'),
                            StringUtils.prepend('"')
                        ),
                        '""'
                    )
                ),
            StringUtils.join(SEPARATOR)
        );
    }


    function getFieldValue(field: any): string {

        const value: string = Array.isArray(field)
            ? field.join(ARRAY_SEPARATOR)
            : field + '';   // Convert numbers to strings

        return value.replace(new RegExp('"', 'g'), '""');
    }
}
