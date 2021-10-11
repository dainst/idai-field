import { BaseFormDefinition, BaseGroupDefinition } from './base-form-definition';


export interface BuiltInFormDefinition extends BaseFormDefinition {

    groups: Array<BaseGroupDefinition>;
}