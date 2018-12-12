import {on} from 'tsfun';
import {FieldDefinition, IdaiFieldGeometry, NewResource, ProjectConfiguration, RelationDefinition,
    Resource, NewDocument, Document} from 'idai-components-2';
import {validateFloat, validateUnsignedFloat, validateUnsignedInt} from '../util/number-util';
import {ValidationErrors} from './validation-errors';


export module Validations {


    /**
     * @throws [INVALID_NUMERICAL_VALUE]
     */
    export function assertCorrectnessOfNumericalValues(document: Document|NewDocument, projectConfiguration: ProjectConfiguration) {

        const invalidNumericValues = Validations.validateNumericValues(document.resource, projectConfiguration);
        if (invalidNumericValues ) {
            throw [
                ValidationErrors.INVALID_NUMERICAL_VALUES,
                document.resource.type,
                invalidNumericValues.join(', ')
            ];
        }
    }


    /**
     * @throws [MISSING_PROPERTY]
     */
    export function assertNoFieldsMissing(document: Document|NewDocument, projectConfiguration: ProjectConfiguration): void {

            const missingProperties = Validations.getMissingProperties(document.resource, projectConfiguration);
        if (missingProperties.length > 0) {
            throw [
                ValidationErrors.MISSING_PROPERTY,
                document.resource.type,
                missingProperties.join(', ')
            ];
        }
    }


    export function validateStructureOfGeometries(geometry: IdaiFieldGeometry): Array<string>|null {

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


    export function getMissingProperties(resource: Resource|NewResource, projectConfiguration: ProjectConfiguration) {

        const missingFields: string[] = [];
        const fieldDefinitions: Array<FieldDefinition> = projectConfiguration.getFieldDefinitions(resource.type);

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
    export function validateType(resource: Resource|NewResource, projectConfiguration: ProjectConfiguration): boolean {

        if (!resource.type) return false;
        return projectConfiguration
            .getTypesList()
            .some(on('name:')(resource.type));
    }


    export function validateDefinedFields(resource: Resource|NewResource, projectConfiguration: ProjectConfiguration): Array<string> {

        const projectFields: Array<FieldDefinition> = projectConfiguration.getFieldDefinitions(resource.type);
        const defaultFields: Array<FieldDefinition> = [{ name: 'relations' }];

        const fields: Array<any> = projectFields.concat(defaultFields);

        let invalidFields: Array<any> = [];

        for (let resourceField in resource) {
            if (resource.hasOwnProperty(resourceField)) {
                let fieldFound: boolean = false;
                for (let i in fields) {
                    if (fields[i].name === resourceField) {
                        fieldFound = true;
                        break;
                    }
                }
                if (!fieldFound) {
                    invalidFields.push(resourceField);
                }
            }
        }

        if (projectConfiguration.getFieldDefinitions(resource.type) // TODO unit test this
                .find(fd => fd.name === 'dating')) {
            invalidFields = invalidFields
                .filter(_ => _ !== 'period' && _!== 'periodEnd');
        }
        return (invalidFields.length > 0) ? invalidFields : [];
    }


    /**
     * @returns {string[]} the names of invalid relation fields if one or more of the fields are invalid, otherwise
     * <code>undefined</code>
     */
    export function validateDefinedRelations(resource: Resource|NewResource, projectConfiguration: ProjectConfiguration): string[] {

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


    export function validateNumericValues(resource: Resource|NewResource, projectConfiguration: ProjectConfiguration): string[]|undefined {

        const projectFields: Array<FieldDefinition> = projectConfiguration.getFieldDefinitions(resource.type);
        const numericInputTypes: string[] = ['unsignedInt', 'float', 'unsignedFloat'];
        const invalidFields: string[] = [];

        projectFields.filter(fieldDefinition => {
            return fieldDefinition.inputType && numericInputTypes.includes(fieldDefinition.inputType)
        }).forEach(fieldDefinition => {
            let value = resource[fieldDefinition.name];

            if (value && numericInputTypes.includes(fieldDefinition.inputType as string)
                    && !validateNumber(value, fieldDefinition.inputType as string)) {
                invalidFields.push(fieldDefinition.name);
            }
        });

        return (invalidFields.length > 0) ? invalidFields : undefined;
    }


    function validateNumber(value: string, inputType: string): boolean {

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
}