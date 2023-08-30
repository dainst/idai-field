import { BaseFieldDefinition, BaseSubfieldDefinition } from './base-field-definition';


export interface LibraryFieldDefinition extends BaseFieldDefinition {

    valuelistId?: string;
    subfields?: Array<LibrarySubfieldDefinition>;
}


export interface LibrarySubfieldDefinition extends BaseSubfieldDefinition {

    valuelistId?: string;
}


export const VALID_LIBRARY_FIELD_PROPERTIES = [
    'inputType',
    'valuelistId',
    'constraintIndexed',
    'fulltextIndexed',
    'references',
    'selectable',
    'subfields'
];
