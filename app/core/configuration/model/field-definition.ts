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