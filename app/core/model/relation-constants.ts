// Relations

/**
 * Regarding stratigraphical units (Feature type)
 *
 * Time relations are interpretations of users, based on position relations
 */
export module TIME_RELATIONS {

    export const IS_BEFORE = 'isBefore';
    export const IS_AFTER = 'isAfter';
    export const IS_CONTEMPORARY_WITH = 'isContemporaryWith';
    export const ALL = [IS_AFTER, IS_BEFORE, IS_CONTEMPORARY_WITH];
}

/**
 * Regarding stratigraphical units (Feature type)
 */
export module POSITION_RELATIONS {

    export const IS_BELOW = 'isBelow';                // is read off by a user by sight
    export const IS_ABOVE = 'isAbove';                // is read off by a user by sight
    export const IS_EQUIVALENT_TO = 'isEquivalentTo'; // a user's interpretation that two stratigraphical units (Feature) are the same

    export const BORDERS = 'borders';                 //
    export const CUTS = 'cuts';                       //
    export const IS_CUT_BY = 'isCutBy';               //

    export const ALL = [BORDERS, CUTS, IS_CUT_BY, IS_ABOVE, IS_BELOW, IS_EQUIVALENT_TO];
}


/**
 * These relations exists for one to many assignments between operations and contained
 * and between resources and resources contained within those. It does not necessarily 
 * describe a spatial relationship (also it may, depending of the concrete resource domain and range)
 * but says that the app handles it as that structural on-to-many relationship and displays it
 * accordingly (so that operations get views, in which other resoures are listed, and resources
 * are displayed as nested within other resources).
 */
export module HIERARCHICAL_RELATIONS {

    export const RECORDED_IN = 'isRecordedIn';
    export const LIES_WITHIN = 'liesWithin';
    export const INCLUDES = 'includes';
    export const ALL = [LIES_WITHIN, RECORDED_IN, INCLUDES];
}

export const PARENT = 'isChildOf'; // This is a hierarchical relation, but only used in import and export


// To be used later
// Used to signal sameness in a generic manner, for example in order to say
// two resources, recorded in different operations, are the same
export const SAME_AS = 'isSameAs';


// Used to connect finds with type resources
export const IS_LIKE = 'isLike';