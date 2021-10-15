import { BaseFieldDefinition } from './base-field-definition';


export interface BuiltInFieldDefinition extends BaseFieldDefinition {

    valuelistId?: string;
    positionValuelistId?: string;
    inputTypeOptions?: { validation?: { permissive?: true } };
    visible?: boolean;
    editable?: boolean;
    mandatory?: boolean;
    valuelistFromProjectField?: string;
    allowOnlyValuesOfParent?: boolean;
}
