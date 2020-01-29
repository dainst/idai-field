import {includedIn, is, isNot, on} from 'tsfun';
import {Dating, Dimension, Document, FieldGeometry, NewDocument, NewResource,
    Resource} from 'idai-components-2';
import {validateFloat, validateUnsignedFloat, validateUnsignedInt} from '../util/number-util';
import {ValidationErrors} from './validation-errors';
import {INPUT_TYPE, INPUT_TYPES} from '../../c';
import {subtract} from 'tsfun';
import {ProjectConfiguration} from '../configuration/project-configuration';
import {FieldDefinition} from '../configuration/model/field-definition';
import {RelationDefinition} from '../configuration/model/relation-definition';


export module Validations {

    type FieldName = string;

    /**
     * @throws [INVALID_NUMERICAL_VALUES]
     */
    export function assertCorrectnessOfNumericalValues(document: Document|NewDocument,
                                                       projectConfiguration: ProjectConfiguration,
                                                       allowStrings: boolean = true) {

        const invalidFields: string[] = Validations.validateNumericValues(
            document.resource,
            projectConfiguration,
            allowStrings ? validateNumberAsString : validateNumber,
            ['unsignedInt', 'float', 'unsignedFloat']
        );
        if (invalidFields.length > 0) {
            throw [
                ValidationErrors.INVALID_NUMERICAL_VALUES,
                document.resource.type,
                invalidFields.join(', ')
            ];
        }
    }


    /**
     * @throws [INVALID_DECIMAL_SEPARATORS]
     */
    export function assertUsageOfDotAsDecimalSeparator(document: Document|NewDocument,
                                                       projectConfiguration: ProjectConfiguration) {

        const invalidFields: string[] = Validations.validateNumericValues(
            document.resource,
            projectConfiguration,
            validateDecimalSeparator,
            ['float', 'unsignedFloat']
        );
        if (invalidFields.length > 0) {
            throw [
                ValidationErrors.INVALID_DECIMAL_SEPARATORS,
                document.resource.type,
                invalidFields.join(', ')
            ];
        }
    }


    /**
     * @throws [INVALID_DATING_VALUES]
     */
    export function assertCorrectnessOfDatingValues(document: Document|NewDocument,
                                                    projectConfiguration: ProjectConfiguration) {

        const invalidFields: string[] = Validations.validateObjectArrays(
            document.resource, projectConfiguration, 'dating', Dating.isValid
        );

        if (invalidFields.length > 0) {
            throw [
                ValidationErrors.INVALID_DATING_VALUES,
                document.resource.type,
                invalidFields.join(', ')
            ];
        }
    }


    /**
     * @throws [INVALID_DIMENSION_VALUES]
     */
    export function assertCorrectnessOfDimensionValues(document: Document|NewDocument,
                                                       projectConfiguration: ProjectConfiguration) {

        const invalidFields: string[] = Validations.validateObjectArrays(
            document.resource, projectConfiguration, 'dimension', Dimension.isValid
        );

        if (invalidFields.length > 0) {
            throw [
                ValidationErrors.INVALID_DIMENSION_VALUES,
                document.resource.type,
                invalidFields.join(', ')
            ];
        }
    }


    /**
     * @throws [MISSING_PROPERTY]
     */
    export function assertNoFieldsMissing(document: Document|NewDocument,
                                          projectConfiguration: ProjectConfiguration): void {

        const missingProperties = Validations.getMissingProperties(document.resource, projectConfiguration);

        if (missingProperties.length > 0) {
            throw [
                ValidationErrors.MISSING_PROPERTY,
                document.resource.type,
                missingProperties.join(', ')
            ];
        }
    }


    export function validateStructureOfGeometries(geometry: FieldGeometry): Array<string>|null {

        if (!geometry) return null;

        if (!geometry.type) return [ValidationErrors.MISSING_GEOMETRY_TYPE];
        if (!geometry.coordinates) return [ValidationErrors.MISSING_COORDINATES];

        switch(geometry.type) {
            case 'Point':
                if (!Validations.validatePointCoordinates(geometry.coordinates)) {
                    return [ValidationErrors.INVALID_COORDINATES, 'Point'];
                }
                break;
            case 'MultiPoint':
                if (!Validations.validatePolylineOrMultiPointCoordinates(geometry.coordinates)) {
                    return [ValidationErrors.INVALID_COORDINATES, 'MultiPoint'];
                }
                break;
            case 'LineString':
                if (!Validations.validatePolylineOrMultiPointCoordinates(geometry.coordinates)) {
                    return [ValidationErrors.INVALID_COORDINATES, 'LineString'];
                }
                break;
            case 'MultiLineString':
                if (!Validations.validateMultiPolylineCoordinates(geometry.coordinates)) {
                    return [ValidationErrors.INVALID_COORDINATES, 'MultiLineString'];
                }
                break;
            case 'Polygon':
                if (!Validations.validatePolygonCoordinates(geometry.coordinates)) {
                    return [ValidationErrors.INVALID_COORDINATES, 'Polygon'];
                }
                break;
            case 'MultiPolygon':
                if (!Validations.validateMultiPolygonCoordinates(geometry.coordinates)) {
                    return [ValidationErrors.INVALID_COORDINATES, 'MultiPolygon'];
                }
                break;
            default:
                return [ValidationErrors.UNSUPPORTED_GEOMETRY_TYPE, geometry.type];
        }

        return null;
    }


    export function getMissingProperties(resource: Resource|NewResource,
                                         projectConfiguration: ProjectConfiguration) {

        const missingFields: string[] = [];
        const fieldDefinitions: Array<FieldDefinition>
            = projectConfiguration.getFieldDefinitions(resource.type);

        for (let fieldDefinition of fieldDefinitions) {
            if (projectConfiguration.isMandatory(resource.type, fieldDefinition.name)) {
                if (resource[fieldDefinition.name] === undefined || resource[fieldDefinition.name] === '') {
                    missingFields.push(fieldDefinition.name);
                }
            }
        }

        return missingFields;
    }

    /**
     *
     * @param resource
     * @param projectConfiguration
     * @returns {boolean} true if the type of the resource is valid, otherwise false
     */
    export function validateType(resource: Resource|NewResource,
                                 projectConfiguration: ProjectConfiguration): boolean {

        if (!resource.type) return false;
        return projectConfiguration
            .getTypesList()
            .some(on('name', is(resource.type)));
    }


    /**
     * @returns the names of invalid fields if one or more of the fields are not defined in projectConfiguration
     */
    export function validateDefinedFields(resource: Resource|NewResource,
                                          projectConfiguration: ProjectConfiguration): string[] {

        const projectFields: Array<FieldDefinition> = projectConfiguration.getFieldDefinitions(resource.type);
        const defaultFields: Array<FieldDefinition> = [{ name: 'relations' } as FieldDefinition];

        const definedFields: Array<any> = projectFields.concat(defaultFields);

        let invalidFields: Array<any> = [];

        for (let resourceField in resource) {
            if (resource.hasOwnProperty(resourceField)) {
                let fieldFound: boolean = false;
                for (let i in definedFields) {
                    if (definedFields[i].name === resourceField) {
                        fieldFound = true;
                        break;
                    }
                }
                if (!fieldFound) invalidFields.push(resourceField);
            }
        }

        const dropDownRangeEndFields = getDropdownRangeEndFields(resource, projectFields);
        invalidFields = subtract(dropDownRangeEndFields)(invalidFields);
        return (invalidFields.length > 0) ? invalidFields : [];
    }


    /**
     * @returns dropDownRange 'End'-fields
     */
    function getDropdownRangeEndFields(resource: Resource|NewResource,
        fieldDefinitions: Array<FieldDefinition>): FieldName[] {

        return reduceForFieldsOfType(
            resource,
            fieldDefinitions,
            INPUT_TYPES.DROPDOWN_RANGE,
            (dropdownRangeEndFields: any, dropdownRangeFieldName: any) => {
                return dropdownRangeEndFields.concat(dropdownRangeFieldName + 'End')
            },
            []);
    }


    /**
     * @returns the names of invalid relation fields if one or more of the fields are invalid
     */
    export function validateDefinedRelations(resource: Resource|NewResource,
                                             projectConfiguration: ProjectConfiguration): string[] {

        const fields: Array<RelationDefinition> = projectConfiguration.getRelationDefinitions(resource.type) as any;
        const invalidFields: Array<any> = [];

        for (let relationField in resource.relations) {
            if (resource.relations.hasOwnProperty(relationField)) {
                let fieldFound: boolean = false;
                for (let i in fields) {
                    if (fields[i].name === relationField) {
                        fieldFound = true;
                        break;
                    }
                }
                if (!fieldFound) {
                    invalidFields.push(relationField);
                }
            }
        }

        return (invalidFields.length > 0) ? invalidFields : [];
    }


    export function validateNumericValues(resource: Resource|NewResource,
                                          projectConfiguration: ProjectConfiguration,
                                          validationFunction: (value: string, inputType: string) => boolean,
                                          numericInputTypes: string[]): string[] {

        const projectFields: Array<FieldDefinition> = projectConfiguration.getFieldDefinitions(resource.type);
        const invalidFields: string[] = [];

        projectFields.filter(fieldDefinition => {
            return fieldDefinition.inputType && numericInputTypes.includes(fieldDefinition.inputType)
        }).forEach(fieldDefinition => {
            let value = resource[fieldDefinition.name];

            if (value && numericInputTypes.includes(fieldDefinition.inputType as string)
                    && !validationFunction(value, fieldDefinition.inputType as string)) {
                invalidFields.push(fieldDefinition.name);
            }
        });

        return invalidFields;
    }


    function validateNumberAsString(value: string|number, inputType: string): boolean {

        if (typeof value === 'number') value = value.toString();

        switch(inputType) {
            case 'unsignedInt':
                return validateUnsignedInt(value);
            case 'float':
                return validateFloat(value);
            case 'unsignedFloat':
                return validateUnsignedFloat(value);
            default:
                return false;
        }
    }


    function validateNumber(value: string|number, inputType: string): boolean {

        if (typeof value !== 'number') return false;

        return validateNumberAsString(value, inputType);
    }


    function validateDecimalSeparator(value: string|number): boolean {

        return typeof value === 'number' || !value.includes(',');
    }


    export function validatePointCoordinates(coordinates: number[]): boolean {

        if (coordinates.length < 2 || coordinates.length > 3) return false;
        if (isNaN(coordinates[0])) return false;
        if (isNaN(coordinates[1])) return false;
        if (coordinates.length === 3 && isNaN(coordinates[2])) return false;

        return true;
    }


    export function validatePolylineOrMultiPointCoordinates(coordinates: number[][]): boolean {

        return coordinates.length >= 2
            && coordinates.every(validatePointCoordinates);
    }


    export function validateMultiPolylineCoordinates(coordinates: number[][][]): boolean {

        return coordinates.length !== 0
            && coordinates.every(validatePolylineOrMultiPointCoordinates);
    }


    export function validatePolygonCoordinates(coordinates: number[][][]): boolean {

        if (coordinates.length === 0) return false;

        for (let i in coordinates) {
            if (coordinates[i].length < 3) return false;

            for (let j in coordinates[i]) {
                if (!validatePointCoordinates(coordinates[i][j])) return false;
            }
        }

        return true;
    }


    export function validateMultiPolygonCoordinates(coordinates: number[][][][]): boolean {

        return coordinates.length !== 0
            && coordinates.every(validatePolygonCoordinates);
    }


    export function validateObjectArrays(resource: Resource|NewResource,
                                         projectConfiguration: ProjectConfiguration,
                                         inputType: 'dating'|'dimension',
                                         validate: (object: any) => boolean): string[] {

        return projectConfiguration.getFieldDefinitions(resource.type)
            .filter(field => field.inputType === inputType)
            .filter(field => {
                return resource[field.name] !== undefined &&
                    resource[field.name].filter((object: any) => !validate(object)).length > 0;
            }).map(field => field.name);
    }


    function reduceForFieldsOfType<A>(resource: Resource|NewResource,
                                      fieldDefinitions: Array<FieldDefinition>,
                                      fieldType: string,
                                      doForField: (acc: A, matchedFieldName: string) => A,
                                      acc: A): A {

        return fieldDefinitions
            .filter(on(INPUT_TYPE, is(fieldType)))
            .reduce((acc: A, dropdownRangeFieldDefinition) => {

                const matchedFieldName = Object.keys(resource)
                    .filter(isNot(includedIn(['relations', 'geometry'])))
                    .find(is(dropdownRangeFieldDefinition.name));

                if (!matchedFieldName) return acc;
                return doForField(acc, matchedFieldName);

            }, acc);
    }
}