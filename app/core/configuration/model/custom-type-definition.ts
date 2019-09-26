import {assertFieldsAreValid} from '../assert-fields-are-valid';
import {ConfigurationErrors} from '../configuration-errors';
import {BaseFieldDefinition, BaseTypeDefinition} from "./base-type-definition";

/**
 * TypeDefinition, as provided by users.
 *
 * @author Daniel de Oliveira
 */
export interface CustomTypeDefinition extends BaseTypeDefinition {

    commons?: string[];
    color?: string,
    hidden?: string[];
    parent?: string,
    fields: CustomFieldDefinitions; // TODO make optional
}


export type CustomFieldDefinitions = { [fieldName: string]: CustomFieldDefinition };


export interface CustomFieldDefinition extends BaseFieldDefinition {

    valuelistId?: string;
    inputType?: string;
    positionValues?: string;
}


const VALID_FIELD_PROPERTIES = ['valuelistId', 'inputType', 'positionValues'];


export type CustomTypeDefinitions = {[typeName: string]: CustomTypeDefinition };


export module CustomTypeDefinition {

    export function makeAssertIsValid(builtinTypes: string[], libraryTypes: string[]) {

        return function assertIsValid([typeName, type]: [string, CustomTypeDefinition]) {

            if (!builtinTypes.includes(typeName) && !libraryTypes.includes(typeName)) {
                if (!type.parent) throw [ConfigurationErrors.MISSING_TYPE_PROPERTY, 'parent', typeName];
            }

            if (!type.fields) throw [ConfigurationErrors.MISSING_TYPE_PROPERTY, 'fields', type];
            assertFieldsAreValid(type.fields, VALID_FIELD_PROPERTIES, 'custom');
        }
    }
}