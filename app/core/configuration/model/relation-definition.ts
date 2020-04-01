import {Labelled, Named} from '../../util/named';


/**
 * @author Daniel de Oliveira
 */
export interface RelationDefinition extends Named, Labelled {

    domain: string[];
    range: string[];
    inverse?: any; // TODO make mandatory
    visible?: boolean; // determines the visibility of that relation in show type widgets
    editable?: boolean; // determines the visibility of that relation in edit type widgets
    sameMainCategoryResource?: boolean;
}


export module RelationDefinition {

    export const DOMAIN = 'domain';
    export const RANGE = 'range';
}