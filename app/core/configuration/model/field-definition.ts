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
}


export module FieldDefinition {

    export const VISIBLE = 'visible';
    export const MANDATORY = 'mandatory';
    export const EDITABLE = 'editable';
    export const NAME = 'name';
    export const LABEL = 'label';
    export const DESCRIPTION = 'description';
    export const FULLTEXTINDEXED = 'fulltextIndexed';
    export const CONSTRAINTINDEXED = 'constraintIndexed';
    export const GROUP = 'group';
}