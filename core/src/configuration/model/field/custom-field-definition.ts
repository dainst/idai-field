import { BaseFieldDefinition, BaseSubfieldDefinition } from './base-field-definition';


export interface CustomFieldDefinition extends BaseFieldDefinition {

    mandatory?: boolean;

    // For relation fields
    range?: string[];
    inverse?: string;
}

export interface CustomSubfieldDefinition extends BaseSubfieldDefinition {}


export module CustomFieldDefinition {

    export const INPUTTYPE = 'inputType';
}


export const VALID_CUSTOM_FIELD_PROPERTIES = [
    'inputType', 'mandatory', 'constraintIndexed', 'references', 'condition', 'subfields', 'range', 'inverse',
    'dateConfiguration'
];
