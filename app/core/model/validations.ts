import {FieldDefinition, ProjectConfiguration, RelationDefinition} from 'idai-components-2';
import {Resource, NewResource} from 'idai-components-2';
import {validateFloat, validateUnsignedFloat, validateUnsignedInt} from '../../util/number-util';
import {on} from 'tsfun';

export module Validations {

    export function getMissingProperties(resource: Resource|NewResource, projectConfiguration: ProjectConfiguration) {

        const missingFields: string[] = [];
        const fieldDefinitions: Array<FieldDefinition> = projectConfiguration.getFieldDefinitions(resource.type);

        for (let fieldDefinition of fieldDefinitions) {
            if (projectConfiguration.isMandatory(resource.type,fieldDefinition.name)) {
                if (resource[fieldDefinition.name] == undefined || resource[fieldDefinition.name] == '') {
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


    export function validateFields(resource: Resource|NewResource, projectConfiguration: ProjectConfiguration): Array<string> {

        const projectFields: Array<FieldDefinition> = projectConfiguration.getFieldDefinitions(resource.type);
        const defaultFields: Array<FieldDefinition> = [{ name: 'relations' }];

        const fields: Array<any> = projectFields.concat(defaultFields);

        let invalidFields: Array<any> = [];

        for (let resourceField in resource) {
            if (resource.hasOwnProperty(resourceField)) {
                let fieldFound: boolean = false;
                for (let i in fields) {
                    if (fields[i].name == resourceField) {
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
                .find(fd => fd.name === 'hasDating')) {
            invalidFields = invalidFields
                .filter(_ => _ !== 'hasPeriod' && _!== 'hasPeriodEnd');
        }
        return (invalidFields.length > 0) ? invalidFields : [];
    }


    /**
     * @returns {string[]} the names of invalid relation fields if one or more of the fields are invalid, otherwise
     * <code>undefined</code>
     */
    export function validateRelations(resource: Resource|NewResource, projectConfiguration: ProjectConfiguration): string[] {

        const fields: Array<RelationDefinition> = projectConfiguration.getRelationDefinitions(resource.type) as any;
        const invalidFields: Array<any> = [];

        for (let relationField in resource.relations) {
            if (resource.relations.hasOwnProperty(relationField)) {
                let fieldFound: boolean = false;
                for (let i in fields) {
                    if (fields[i].name == relationField) {
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
                invalidFields.push(fieldDefinition.label as any);
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
        if (coordinates.length == 3 && isNaN(coordinates[2])) return false;

        return true;
    }


    export function validatePolylineCoordinates(coordinates: number[][]): boolean {

        if (coordinates.length < 2) return false;

        for (let i in coordinates) {
            if (!validatePointCoordinates(coordinates[i])) return false;
        }

        return true;
    }


    export function validateMultiPolylineCoordinates(coordinates: number[][][]): boolean {

        if (coordinates.length == 0) return false;

        for (let i in coordinates) {
            if (!validatePolylineCoordinates(coordinates[i])) return false;
        }

        return true;
    }


    export function validatePolygonCoordinates(coordinates: number[][][]): boolean {

        if (coordinates.length == 0) return false;

        for (let i in coordinates) {
            if (coordinates[i].length < 3) return false;

            for (let j in coordinates[i]) {
                if (!validatePointCoordinates(coordinates[i][j])) return false;
            }
        }

        return true;
    }


    export function validateMultiPolygonCoordinates(coordinates: number[][][][]): boolean {

        if (coordinates.length == 0) return false;

        for (let i in coordinates) {
            if (!validatePolygonCoordinates(coordinates[i])) return false;
        }

        return true;
    }
}