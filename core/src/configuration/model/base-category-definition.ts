import { Map } from 'tsfun';
import { Valuelists } from '../../model/configuration/valuelist';


export interface BaseCategoryDefinition {

    fields: Map<BaseFieldDefinition>;
    groups?: Array<BaseGroupDefinition>;
    valuelists?: Valuelists;
}


export module BaseCategoryDefinition {

    export const FIELDS = 'fields';
    export const GROUPS = 'groups';
}


export interface BaseFieldDefinition {

    inputType?: string;
    constraintIndexed?: boolean;
    fulltextIndexed?: boolean;
    source?: 'builtin'|'library'|'custom'|'common';
}


export interface BaseGroupDefinition {

    name: string;
    fields: string[];
}


export module BaseFieldDefinition {

    export const INPUTTYPE = 'inputType';
}
