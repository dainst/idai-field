import { Labelled, Named } from "../tools/named";


/**
 * @author Daniel de Oliveira
 */
export interface RelationDefinition extends Named, Labelled {

    domain: string[];
    range: string[];
    inverse?: any;
    sameMainCategoryResource?: boolean;
}


export module RelationDefinition {

    export const DOMAIN = 'domain';
    export const RANGE = 'range';
}
