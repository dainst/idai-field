/**
 * @author Daniel de Oliveira
 */
export interface FieldDefinition {

    label?: string;
    name: string;
    description?: string;
    inputType?:
        'input'
        |'unsignedInt'
        |'unsignedFloat'
        |'float'
        |'text'
        |'multiInput'
        |'dropdown'
        |'dropdownRange'
        |'radio'
        |'boolean'
        |'checkboxes'
        |'dating'
        |'date'
        |'dimension'
        |'geometry'
        |'instanceOf'
        |'catalogCriterion'
        |'default';
    valuelist?: string[];
    valuelistFromProjectField?: string;
    editable?: boolean;                 // defaults to true
    visible?: boolean;                  // defaults to true
    mandatory?: true;
    fulltextIndexed?: true;
    constraintIndexed?: true;
    allowOnlyValuesOfParent?: true;
    readonly group: string;
    source?: 'builtin'|'library'|'custom'; // TODO make non-optional
}


export module FieldDefinition {

    export const SOURCE = 'source';
    export const VISIBLE = 'visible';
    export const MANDATORY = 'mandatory';
    export const EDITABLE = 'editable';
    export const NAME = 'name';
    export const LABEL = 'label';
    export const DESCRIPTION = 'description';
    export const FULLTEXTINDEXED = 'fulltextIndexed';
    export const CONSTRAINTINDEXED = 'constraintIndexed';
    export const GROUP = 'group';

    export module Source {

        export const BUILTIN = 'builtin';
        export const LIBRARY = 'library';
        export const CUSTOM = 'custom';
    }

    export module InputType {

        export const INPUT = 'input';
        export const UNSIGNEDINT = 'unsignedInt';
        export const UNSIGNEDFLOAT = 'unsignedFloat';
        export const FLOAT = 'float';
        export const TEXT = 'text';
        export const MULTIINPUT = 'multiinput';
        export const DROPDOWN = 'dropdown';
        export const DROPDOWNRANGE = 'dropdownRange';
        export const RADIO = 'radio';
        export const BOOLEAN = 'boolean';
        export const CHECKBOXES = 'checkboxes';
        export const DATING = 'dating';
        export const DATE = 'date';
        export const DIMENSION = 'dimension';
        export const GEOMETRY = 'geometry';
        export const CATALOGCRITERION = 'catalogCriterion';
        export const DEFAULT = 'default';
    }
}