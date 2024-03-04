import { LibraryFieldDefinition } from './library-field-definition';


export interface BuiltInFieldDefinition extends LibraryFieldDefinition {

    inputTypeOptions?: { validation?: { permissive?: true } };
    visible?: boolean;
    editable?: boolean;
    selectable?: boolean;
    mandatory?: true;
    fixedInputType?: true;
    valuelistFromProjectField?: string;
    allowOnlyValuesOfParent?: boolean;
    maxCharacters?: number;
    constraintName?: string; // For input type derivedRelation
}
