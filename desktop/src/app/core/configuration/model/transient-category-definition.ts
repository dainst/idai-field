import {Map} from 'tsfun';
import {BuiltinFieldDefinition} from './builtin-category-definition';
import {LibraryFieldDefinition, LibraryCategoryDefinition} from './library-category-definition';
import {ValuelistDefinition} from 'idai-field-core';


export interface TransientCategoryDefinition extends BuiltinFieldDefinition, LibraryCategoryDefinition {

    fields: Map<TransientFieldDefinition>;
}


export module TransientCategoryDefinition {

    export const FIELDS = 'fields';
    export const COMMONS = 'commons';
}


export interface TransientFieldDefinition extends BuiltinFieldDefinition, LibraryFieldDefinition {

    valuelist?: ValuelistDefinition;
    valuelistId?: string,
    valuelistFromProjectField?: string;
    visible?: boolean;
    editable?: boolean;
    constraintIndexed?: true;
    source?: 'builtin'|'library'|'custom'|'common';
}


export module TransientFieldDefinition {

    export const VALUELIST = 'valuelist';
    export const VALUELISTID = 'valuelistId';
    export const POSITION_VALUES = 'positionValues';
    export const POSITION_VALUELIST_ID = 'positionValuelistId';
}
