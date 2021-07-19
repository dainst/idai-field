import {flow} from 'tsfun';
import {assocReduce} from '../../tools/assoc-reduce';
import {Name} from '../../tools/named';
import {toPair} from '../../tools/utils';
import { Field } from './field';


export interface Relation extends Field {

    domain: string[];
    range: string[];
    inverse?: any;
    sameMainCategoryResource?: boolean;
}


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export namespace Relation {

    export const DOMAIN = 'domain';
    export const RANGE = 'range';


    /**
     * Regarding stratigraphical units (Feature category)
     *
     * Time relations are interpretations of users, based on position relations
     */
    export module Time {

        export const BEFORE = 'isBefore';
        export const AFTER = 'isAfter';
        export const CONTEMPORARY = 'isContemporaryWith';
        export const ALL = [AFTER, BEFORE, CONTEMPORARY];
    }


    /**
     * Regarding stratigraphical units (Feature category)
     */
    export module Position {

        export const BELOW = 'isBelow';                // is read off by a user by sight
        export const ABOVE = 'isAbove';                // is read off by a user by sight

        export const BORDERS = 'borders';                 //
        export const CUTS = 'cuts';                       //
        export const CUTBY = 'isCutBy';               //

        export const ALL = [BORDERS, CUTS, CUTBY, ABOVE, BELOW];
    }


    /**
     * These relations exists for one to many assignments between operations and contained
     * and between resources and resources contained within those. It does not necessarily
     * describe a spatial relationship (also it may, depending of the concrete resource domain and range)
     * but says that the app handles it as that structural on-to-many relationship and displays it
     * accordingly (so that operations get views, in which other resoures are listed, and resources
     * are displayed as nested within other resources). The semantics of a hierarchical relation depends on
     * its context, as constituted by the categories involved. For example a liesWithin between 'Inscription'
     * and 'Find' is, what a user would describe as meaningful relationship between them, in this case that
     * a Find can be marked with (one or more) letter-type embellishments.
     */
    export module Hierarchy {

        export const RECORDEDIN = 'isRecordedIn';        // TODO get rid of this, in favor of isChildOf
        export const LIESWITHIN = 'liesWithin';          // TODO get rid of this, in favor of isChildOf 
        export const ALL = [LIESWITHIN, RECORDEDIN];
    }


    export const PARENT = 'isChildOf'; // This is a hierarchical relation, but only used in import and export


    // Used to signal sameness (a claim of identity) in a generic manner, for example in order to say
    // two resources, recorded in different operations, are the same
    export const SAME_AS = 'isSameAs';


    // Used to connect finds with type resources
    export module Type {

        export const INSTANCEOF = 'isInstanceOf';
        export const HASINSTANCE = 'hasInstance';
        export const ALL = [INSTANCEOF, HASINSTANCE];
    }


    export module Image {

        export const DEPICTS = 'depicts';
        export const ISDEPICTEDIN = 'isDepictedIn';
        export const HASMAPLAYER = 'hasMapLayer';
        export const ISMAPLAYEROF = 'isMapLayerOf';
        export const ALL = [DEPICTS, ISDEPICTEDIN, HASMAPLAYER, ISMAPLAYEROF];
    }


    export const UNIDIRECTIONAL = Hierarchy.ALL;


    /**
     * @returns {boolean} True if the given domain category is a valid domain name for a relation definition
     * which has the given range category & name
     */
     export function isAllowedRelationDomainCategory(relations: Array<Relation>,
                                                     domainCategory: Name, 
                                                     rangeCategory: Name,
                                                     relation: Name): boolean {

        const relationDefinitions = getRelations(relations, rangeCategory, true);

        for (let relationDefinition of relationDefinitions) {
        if (relation === relationDefinition.name
            && relationDefinition.domain.indexOf(domainCategory) > -1) return true;
        }

        return false;
    }


    export function getRelations(relations: Array<Relation>,
                                 categoryName: string,
                                 isRangeCategory: boolean = false) {

        const availableRelationFields: Array<Relation> = [];

        for (let relationField of relations) {
            const categories: string[] = isRangeCategory ? relationField.range : relationField.domain;
            if (categories.indexOf(categoryName) > -1) availableRelationFields.push(relationField);
        }

        return availableRelationFields;
    }


    export type InverseRelationsMap = {

        [_: string]:    // relation name for every defined relation, independent if it has an inverse or not
            string      // inverse relation name, if existent
            | undefined // for relations without inverse
    }


    export function makeInverseRelationsMap(relationDefinitions: Array<Relation>) {
    
        return flow(
            relationDefinitions,
            assocReduce(
                toPair<string>('name', 'inverse'),
                {}) as any) as InverseRelationsMap;
    }
}
