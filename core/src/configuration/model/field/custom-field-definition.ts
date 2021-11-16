import { BaseFieldDefinition } from './base-field-definition';


export interface CustomFieldDefinition extends BaseFieldDefinition {

    inputType?: string;
}


export module CustomFieldDefinition {

    export const INPUTTYPE = 'inputType';
}


export const VALID_CUSTOM_FIELD_PROPERTIES = ['inputType', 'constraintIndexed', 'fulltextIndexed'];
