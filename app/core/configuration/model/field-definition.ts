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
        |'default'; // TODO review value 'default'
    valuelist?: string[];
    valuelistFromProjectField?: string;
    editable?: boolean;                 // defaults to true
    visible?: boolean;                  // defaults to true
    mandatory?: boolean;                // defaults to false
    fulltextIndexed?: boolean;          // defaults to false
    constraintIndexed?: boolean;        // defaults to false
    allowOnlyValuesOfParent?: boolean;  // defaults to false
    readonly group: string;
}