import { Map } from 'tsfun';


export interface BaseCategoryDefinition {

    fields: Map<BaseFieldDefinition>;
    groups?: Array<BaseGroupDefinition>;
}


export module BaseCategoryDefinition {

    export const FIELDS = 'fields';
    export const GROUPS = 'groups';
}


export interface BaseFieldDefinition {

    inputType?: string;
    constraintIndexed?: true;
    source?: 'builtin'|'library'|'custom'|'common';
}


export interface BaseGroupDefinition {

    name: string;
    fields: string[];
}


export module BaseFieldDefinition {

    export const INPUTTYPE = 'inputType';
}
