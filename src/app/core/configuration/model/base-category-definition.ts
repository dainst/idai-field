import {Map} from 'tsfun';


export interface BaseCategoryDefinition {

    fields: Map<BaseFieldDefinition>;
}


export module BaseCategoryDefinition {

    export const FIELDS = 'fields';
}


export interface BaseFieldDefinition {

    inputType?: string;
    constraintIndexed?: true;
    source?: 'builtin'|'library'|'custom'|'common';
}


export module BaseFieldDefinition {

    export const INPUTTYPE = 'inputType';
}
