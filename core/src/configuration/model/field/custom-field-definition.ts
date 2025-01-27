import { BaseFieldDefinition, BaseSubfieldDefinition } from './base-field-definition';


export interface CustomFieldDefinition extends BaseFieldDefinition {

    // For relation fields
    range?: string[];
    inverse?: string;
}

export interface CustomSubfieldDefinition extends BaseSubfieldDefinition {}


export module CustomFieldDefinition {

    export const INPUTTYPE = 'inputType';
}


export const VALID_CUSTOM_FIELD_PROPERTIES = [
    'inputType', 'constraintIndexed', 'references', 'subfields', 'range', 'inverse'
];
