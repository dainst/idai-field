import { Map } from 'tsfun';
import { BaseFormDefinition } from '../form/base-form-definition';
import { BaseFieldDefinition } from '../field/base-field-definition';


export interface BaseCategoryDefinition {

    fields: Map<BaseFieldDefinition>;
    minimalForm?: BaseFormDefinition;
    color?: string;
    parent?: string;
}


export module BaseCategoryDefinition {

    export const FIELDS = 'fields';
    export const MINIMAL_FORM = 'minimalForm';
}
