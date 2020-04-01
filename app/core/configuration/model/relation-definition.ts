import {Labelled, Named} from '../../util/named';


/**
 * @author Daniel de Oliveira
 */
export interface RelationDefinition extends Named, Labelled {

    domain?: any; // TODO make mandatory
    range?: any;
    inverse?: any;
    visible?: boolean; // determines the visibility of that relation in show type widgets
    editable?: boolean; // determines the visibility of that relation in edit type widgets
    sameMainCategoryResource?: boolean;
}