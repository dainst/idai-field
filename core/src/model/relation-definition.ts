import { Field } from './field';


/**
 * @author Daniel de Oliveira
 */
export interface RelationDefinition extends Field {

    domain: string[];
    range: string[];
    inverse?: any;
    sameMainCategoryResource?: boolean;
}


export module RelationDefinition {

    export const DOMAIN = 'domain';
    export const RANGE = 'range';
}
