import { set, sameset, arrayEqual, flatMap, includedIn, objectEqual } from 'tsfun';
import { Resource } from './resource';


export interface Relations {
    [propName: string]: string[];
}


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export namespace Relations {

    import concatIf = Resource.concatIf;


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
        export const EQUIVALENT = 'isEquivalentTo'; // a user's interpretation that two stratigraphical units (Feature) are the same

        export const BORDERS = 'borders';                 //
        export const CUTS = 'cuts';                       //
        export const CUTBY = 'isCutBy';               //

        export const ALL = [BORDERS, CUTS, CUTBY, ABOVE, BELOW, EQUIVALENT];
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

        export const RECORDEDIN = 'isRecordedIn';
        export const LIESWITHIN = 'liesWithin';
        export const ALL = [LIESWITHIN, RECORDEDIN];
    }


    export const PARENT = 'isChildOf'; // This is a hierarchical relation, but only used in import and export


    // To be used later
    // Used to signal sameness in a generic manner, for example in order to say
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


    export function getAllTargets(relations: Relations, allowedRelations?: string[]): Array<string> {

        const ownKeys = Object.keys(relations)
            .filter(prop => relations.hasOwnProperty(prop));

        const usableRelations = allowedRelations
            ? ownKeys.filter(includedIn(allowedRelations))
            : ownKeys;

        return flatMap(usableRelations, (prop: string) => relations[prop as string]);
    }


    export function getDifferent(relations1: Relations, relations2: Relations): string[] {

        const differingRelationNames: string[]
            = findDifferingFieldsInRelations(relations1, relations2)
                .concat(findDifferingFieldsInRelations(relations2, relations1));

        return set(differingRelationNames);
    }


    export function removeEmpty(relations: Relations) {

        Object.keys(relations)
            .filter(key => relations[key] === null || relations[key].length === 0)
            .forEach(key => delete relations[key]);
    }


    export const equivalent = (r1: Relations) => (r2: Relations) => objectEqual(sameset as any, r1)(r2);


    function findDifferingFieldsInRelations(relations1: Object, relations2: Object): string[] {

        return Object.keys(relations1)
            .reduce(
                concatIf(notBothEqual(relations1, relations2)),
                []
            );
    }


    const notBothEqual = (l: any, r: any) => (key: string) => !r[key] || !arrayEqual(l[key])(r[key]);
}
