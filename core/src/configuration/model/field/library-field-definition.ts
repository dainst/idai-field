import { BaseFieldDefinition } from './base-field-definition';


export interface LibraryFieldDefinition extends BaseFieldDefinition {

    inputType?: string;
    valuelistId?: string;
    positionValuelistId?: string;   // TODO Check if this is correct (valid field property is called positionValues)
}


export const VALID_LIBRARY_FIELD_PROPERTIES = [
    'inputType',
    'valuelistId',
    'positionValues',
    'constraintIndexed',
    'fulltextIndexed',
    'creationDate',
    'createdBy'
];
