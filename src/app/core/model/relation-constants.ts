// Relations

/**
 * Regarding stratigraphical units (Feature category)
 *
 * Time relations are interpretations of users, based on position relations
 */
export module TimeRelations {

    export const BEFORE = 'isBefore';
    export const AFTER = 'isAfter';
    export const CONTEMPORARY = 'isContemporaryWith';
    export const ALL = [AFTER, BEFORE, CONTEMPORARY];
}

/**
 * Regarding stratigraphical units (Feature category)
 */
export module PositionRelations {

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
export module HierarchicalRelations {

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
export module TypeRelations {

    export const INSTANCEOF = 'isInstanceOf';
    export const HASINSTANCE = 'hasInstance';
    export const ALL = [INSTANCEOF, HASINSTANCE];
}


export module ImageRelations {

    export const DEPICTS = 'depicts';
    export const ISDEPICTEDIN = 'isDepictedIn';
    export const HASMAPLAYER = 'hasMapLayer';
    export const ISMAPLAYEROF = 'isMapLayerOf';
    export const ALL = [DEPICTS, ISDEPICTEDIN, HASMAPLAYER, ISMAPLAYEROF];
}


export const UNIDIRECTIONAL_RELATIONS = HierarchicalRelations.ALL;
