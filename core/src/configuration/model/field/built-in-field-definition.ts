import { BaseFieldDefinition } from './base-field-definition';


export interface BuiltInFieldDefinition extends BaseFieldDefinition {

    valuelistId?: string;
    inputTypeOptions?: { validation?: { permissive?: true } };
    visible?: boolean;
    editable?: boolean;
    mandatory?: true;
    fixedInputType?: true;
    valuelistFromProjectField?: string;
    allowOnlyValuesOfParent?: boolean;
    maxCharacters?: number;
}
