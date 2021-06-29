import { Labeled, Named } from '../tools/named';


/**
 * @author Daniel de Oliveira
 */
export interface RelationDefinition extends Named, Labeled {

    domain: string[];
    range: string[];
    inverse?: any;
    sameMainCategoryResource?: boolean;
    editable: boolean;  // Editable in docedit modal
}


export module RelationDefinition {

    export const DOMAIN = 'domain';
    export const RANGE = 'range';
}
