// Constants

export const RESOURCE_IDENTIFIER = 'resource.identifier';
export const RESOURCE_ID = 'resource.id';

export const PARENT = 'isChildOf';
export const RECORDED_IN = 'isRecordedIn';
export const LIES_WITHIN = 'liesWithin';
export const INCLUDES = 'includes';

export const ISRECORDEDIN_CONTAIN = 'isRecordedIn:contain';

export const POSITION_RELATIONS = ['borders', 'cuts', 'isCutBy', 'isAbove', 'isBelow'];
export const TIME_RELATIONS = ['isAfter', 'isBefore', 'isContemporaryWith'];

export module GROUP_NAME {

    export const STEM = 0;
    export const PROPERTIES = 1;
    export const CHILD_PROPERTIES = 2;
    export const DIMENSION = 3;
    export const POSITION = 4;
    export const TIME = 5;
}
