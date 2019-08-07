// Constants

export const RESOURCE_IDENTIFIER = 'resource.identifier';
export const RESOURCE_ID = 'resource.id';

export const PARENT = 'isChildOf';
export const RECORDED_IN = 'isRecordedIn';
export const LIES_WITHIN = 'liesWithin';
export const INCLUDES = 'includes';


export module TIME_RELATIONS_ {

    export const IS_BEFORE = 'isBefore';
    export const IS_AFTER = 'isAfter';
    export const IS_CONTEMPORARY_WITH = 'isContemporaryWith';
}

export module POSITION_RELATIONS_ {

    export const IS_BELOW = 'isBelow';
    export const IS_ABOVE = 'isAbove';

    // TODO remove _ and make ALL field containing the now TIME_RELATIONS field
}


export const ISRECORDEDIN_CONTAIN = 'isRecordedIn:contain';

export const POSITION_RELATIONS = ['borders', 'cuts', 'isCutBy', 'isAbove', 'isBelow'];
export const TIME_RELATIONS = ['isAfter', 'isBefore', 'isContemporaryWith'];
export const HIERARCHICAL_RELATIONS = [LIES_WITHIN, RECORDED_IN, INCLUDES];

export module GROUP_NAME {

    export const STEM = 0;
    export const PROPERTIES = 1;
    export const CHILD_PROPERTIES = 2;
    export const DIMENSION = 3;
    export const POSITION = 4;
    export const TIME = 5;
}


export const INPUT_TYPE = 'inputType';

export module INPUT_TYPES {

    export const DROPDOWN_RANGE = 'dropdownRange';
}
