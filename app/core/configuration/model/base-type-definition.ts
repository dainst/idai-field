import {Map} from 'tsfun';


export interface BaseTypeDefinition {

    fields: Map<BaseFieldDefinition>;
}


export module BaseTypeDefinition {

    export const FIELDS = 'fields';
}


export interface BaseFieldDefinition {

    inputType?: string;
    constraintIndexed?: true;
    source?: 'builtin'|'library'|'custom'|'common';
}