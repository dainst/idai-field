import { flow } from 'tsfun';
import { assocReduce } from '../../tools/assoc-reduce';
import { Name } from '../../tools/named';
import { toPair } from '../../tools/utils';
import { Field } from './field';


export interface Relation extends Field {

    domain: string[];
    range: string[];
    inverse?: string;
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

        export const FILLS = 'fills';
        export const FILLEDBY = 'isFilledBy';

        export const BONDSWITH = 'bondsWith';
        export const ABUTS = 'abuts';
        export const ABUTTEDBY = 'isAbuttedBy';

        export const ALL = [BELOW, ABOVE, BORDERS, CUTS, CUTBY, FILLS, FILLEDBY, BONDSWITH, ABUTS, ABUTTEDBY];
    }


    /**
     * This relation spans a general tree with resources as nodes and leafs.
     * 
     * Although the inspiration for this relation is that of spatial inclusion, the actual semantics
     * are not defined precisely as spatial inclusion of volumes within other volumes but rather depend 
     * on the specific context, as per the categories involved. For example in the case of a Find and
     * a Feature we would use the relation to express that the Find is mostly included in that specific
     * Feature. In the case of an Inscription and a Find we would use it to express that the Find has that
     * specific inscription, which is then a specific instance of an inscription (a token, rather than a type)
     * found on a particular Find.
     * 
     * Having most of the resources of the application in such a forest allows for widely used 
     * and commonly understood hierarchical navigation, as you have it in file browsers etc.
     */
    export const PARENT = 'isChildOf';

    /**
     * This relation spans a directed acyclical graph between resources. Note that
     * there should not be any redundant paths. That means, if A -> B -> C, there should 
     * not be an explicit relation between A and C. Instead the relation is implicit as per the 
     * path from A to C.
     * 
     * It can be used to model relationships where one entity belongs to multiple other entities in some
     * way, as it is the case for example with Doors and Room, where a Door can be part of two Rooms.
     */
    export const IS_PRESENT_IN = 'isPresentIn';


    export namespace Hierarchy {

        export const RECORDEDIN = 'isRecordedIn';        
        export const LIESWITHIN = 'liesWithin';          
        export const ALL = [LIESWITHIN, RECORDEDIN];
    }


    /**
     * Used to signal sameness (a claim of identity) in a generic manner, for example in order to say
     * two resources, recorded in different operations, are the same. 
     * 
     * This relation complements isChildOf in so far as the tree spanned by the latter gains the
     * possibility to express sameness, while retaining its relatively simple structure 
     * (more complex graphs; see also: isPresentIn). Sameness in this way can be seen as an 
     * *interpretation* that parts of an entity, each found in its own (spatial) context and also maybe 
     * described by different persons, actually *are* (rather than are parts of) the *same* entity. 
     * For example one could have two parts of a wall which are not (visibly) physically connected, 
     * but which are taken as having been the *same* wall.
     */ 
    export const SAME_AS = 'isSameAs';


    export const UNIDIRECTIONAL = Hierarchy.ALL.concat([IS_PRESENT_IN]);


    /**
     * Used to connect finds with type resources
     */
    export module Type {

        export const INSTANCEOF = 'isInstanceOf';
        export const HASINSTANCE = 'hasInstance';
        export const ALL = [INSTANCEOF, HASINSTANCE];
    }


    export module Inventory {

        export const ISSTORAGEPLACEOF = 'isStoragePlaceOf';
        export const ISSTOREDIN = 'isStoredIn';
        export const ALL = [ISSTORAGEPLACEOF, ISSTOREDIN];
    }


    export module Image {

        export const DEPICTS = 'depicts';
        export const ISDEPICTEDIN = 'isDepictedIn';
        export const HASMAPLAYER = 'hasMapLayer';
        export const ISMAPLAYEROF = 'isMapLayerOf';
        export const HASDEFAULTMAPLAYER = 'hasDefaultMapLayer';
        export const ALL = [DEPICTS, ISDEPICTEDIN, HASMAPLAYER, ISMAPLAYEROF, HASDEFAULTMAPLAYER];
    }


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
