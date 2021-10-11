import { ValuelistId } from '../../../model/configuration/valuelist';
import { BaseFieldDefinition } from './base-field-definition';


export interface BuiltInFieldDefinition extends BaseFieldDefinition {

    defaultValuelist?: ValuelistId;
    positionValuelistId?: string;
    inputTypeOptions?: { validation?: { permissive?: true } };
    visible?: boolean;
    editable?: boolean;
    mandatory?: boolean;
    valuelistFromProjectField?: string;
    allowOnlyValuesOfParent?: boolean;
}
