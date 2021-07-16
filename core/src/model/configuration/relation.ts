import { Field } from './field';


/**
 * @author Daniel de Oliveira
 */
export interface Relation extends Field {

    domain: string[];
    range: string[];
    inverse?: any;
    sameMainCategoryResource?: boolean;
}


export module Relation {

    export const DOMAIN = 'domain';
    export const RANGE = 'range';
}
