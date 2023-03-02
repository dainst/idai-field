import { BaseFieldDefinition } from './base-field-definition';


export interface LibraryFieldDefinition extends BaseFieldDefinition {

    inputType?: string;
    valuelistId?: string;
}


export const VALID_LIBRARY_FIELD_PROPERTIES = [
    'inputType',
    'valuelistId',
    'constraintIndexed',
    'fulltextIndexed',
    'creationDate',
    'createdBy',
    'references',
    'selectable'
];
