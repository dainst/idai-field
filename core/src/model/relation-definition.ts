import { FieldDefinition } from './field-definition';


/**
 * @author Daniel de Oliveira
 */
export interface RelationDefinition extends FieldDefinition {

    domain: string[];
    range: string[];
    inverse?: any;
    sameMainCategoryResource?: boolean;
}


export module RelationDefinition {

    export const DOMAIN = 'domain';
    export const RANGE = 'range';
}
