/**
 * @author Daniel de Oliveira
 */
export interface RelationDefinition {

    label? : string;
    name: string;
    domain?: any;
    range?: any;
    inverse?: any;
    visible?: boolean; // determines the visiblity of that relation in show type widgets
    editable?: boolean; // determines the visiblity of that relation in edit type widgets
    sameMainTypeResource?: boolean;
}