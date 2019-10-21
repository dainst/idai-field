import {assertFieldsAreValid} from '../assert-fields-are-valid';
import {ConfigurationErrors} from '../configuration-errors';
import {BaseFieldDefinition, BaseTypeDefinition} from './base-type-definition';
import {Valuelists} from './valuelist-definition';


/**
 * TypeDefinition, as used in TypeLibrary
 *
 * @author Daniel de Oliveira
 */
export interface LibraryTypeDefinition extends BaseTypeDefinition {

    color?: string,
    valuelists: Valuelists;
    commons: string[];
    parent?: string,
    typeFamily: string;
    description: {[language: string]: string},
    createdBy: string,
    creationDate: string;
    fields: LibraryFieldDefinitionsMap;
}

export type LibraryTypeDefinitionsMap = { [typeName: string]: LibraryTypeDefinition };


export interface LibraryFieldDefinition extends BaseFieldDefinition {

    inputType?: string;
    positionValues?: string;
}

const VALID_FIELD_PROPERTIES = [
    'valuelistId',
    'inputType',
    'positionValues'
];


export type LibraryFieldDefinitionsMap = { [fieldName: string]: LibraryFieldDefinition };


export module LibraryTypeDefinition {

    export function makeAssertIsValid(builtinTypes: string[]) {

        return function assertIsValid([typeName, type]: [string, LibraryTypeDefinition]) {

            if (type.description === undefined) throw [ConfigurationErrors.MISSING_TYPE_PROPERTY, 'description', typeName];
            if (type.creationDate === undefined) throw [ConfigurationErrors.MISSING_TYPE_PROPERTY, 'creationDate', typeName];
            if (type.createdBy === undefined) throw [ConfigurationErrors.MISSING_TYPE_PROPERTY, 'createdBy', typeName];
            if (type.typeFamily === undefined) throw [ConfigurationErrors.MISSING_TYPE_PROPERTY, 'typeFamily', typeName];
            if (type.commons === undefined) throw [ConfigurationErrors.MISSING_TYPE_PROPERTY, 'commons', typeName];
            if (type.valuelists === undefined) throw [ConfigurationErrors.MISSING_TYPE_PROPERTY, 'valuelists', typeName];

            if (!builtinTypes.includes(type.typeFamily) && !type.parent) throw [ConfigurationErrors.MISSING_TYPE_PROPERTY, 'parent', typeName];

            if (!type.fields) throw [ConfigurationErrors.MISSING_TYPE_PROPERTY, 'creationDate', typeName];
            assertFieldsAreValid(type.fields, VALID_FIELD_PROPERTIES, 'library');
        }
    }
}