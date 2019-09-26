/**
 * @author Daniel de Oliveira
 */
export interface FieldDefinition {

    label?: string;
    name: string;
    description?: string;
    inputType?: string;
    valuelist?: string[];
    editable?: boolean;             // defaults to true
    visible?: boolean;              // defaults to true
    mandatory?: boolean;            // defaults to false
    fulltextIndexed?: boolean;      // defaults to false
    constraintIndexed?: boolean;    // defaults to false
    readonly group: string;
}