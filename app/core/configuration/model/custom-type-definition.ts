import {keys, isNot, includedIn, Map} from 'tsfun';
import {assertFieldsAreValid} from '../boot/assert-fields-are-valid';
import {ConfigurationErrors} from '../boot/configuration-errors';
import {BaseFieldDefinition, BaseTypeDefinition} from './base-type-definition';
import {Valuelists} from './valuelist-definition';

/**
 * TypeDefinition, as provided by users.
 *
 * @author Daniel de Oliveira
 */
export interface CustomTypeDefinition extends BaseTypeDefinition {

    valuelists?: Valuelists,
    commons?: string[];
    color?: string,
    hidden?: string[];
    parent?: string,
    fields: Map<CustomFieldDefinition>;
}


export interface CustomFieldDefinition extends BaseFieldDefinition {

    inputType?: string;
    positionValues?: string;
}

export module CustomFieldDefinition {

    export const INPUTTYPE = 'inputType';
}


const VALID_TYPE_PROPERTIES = ['valuelists', 'commons', 'color', 'hidden', 'parent', 'fields'];

const VALID_FIELD_PROPERTIES = ['inputType', 'positionValues'];


export module CustomTypeDefinition {

    export const VALUELISTS = 'valuelists';

    export function makeAssertIsValid(builtinTypes: string[], libraryTypes: string[]) {

        return function assertIsValid([typeName, type]: [string, CustomTypeDefinition]) {

            keys(type)
                .filter(isNot(includedIn(VALID_TYPE_PROPERTIES)))
                .forEach(key => { throw [ConfigurationErrors.ILLEGAL_TYPE_PROPERTY, key] }); // TODO use pairWith, swap, throws

            if (!builtinTypes.includes(typeName) && !libraryTypes.includes(typeName)) {
                if (!type.parent) {
                    throw [ConfigurationErrors.MISSING_TYPE_PROPERTY, 'parent', typeName, 'must be set for new types'];
                }
            } else {
                if (type.parent) {
                    throw [ConfigurationErrors.ILLEGAL_TYPE_PROPERTY, 'parent', typeName, 'must not be set if not a new type']
                }
            }

            if (!type.fields) {
                throw [ConfigurationErrors.MISSING_TYPE_PROPERTY, 'fields', type];
            }
            assertFieldsAreValid(type.fields, VALID_FIELD_PROPERTIES, 'custom');
        }
    }
}