import {Map} from 'tsfun';
import {ValuelistDefinition} from '../../model/valuelist-definition';
import {Named} from '../../tools/named';
import {BuiltinCategoryDefinition, BuiltinFieldDefinition} from './builtin-category-definition';
import {LibraryFieldDefinition, LibraryCategoryDefinition} from './library-category-definition';


export interface TransientCategoryDefinition extends BuiltinCategoryDefinition, LibraryCategoryDefinition, Named {

    fields: Map<TransientFieldDefinition>;
}


export module TransientCategoryDefinition {

    export const FIELDS = 'fields';
    export const COMMONS = 'commons';
}


export interface TransientFieldDefinition extends BuiltinFieldDefinition, LibraryFieldDefinition, Named {

    valuelist?: ValuelistDefinition;
    valuelistId?: string,
    valuelistFromProjectField?: string;
    constraintIndexed?: true;
    source?: 'builtin'|'library'|'custom'|'common';
}


export module TransientFieldDefinition {

    export const VALUELIST = 'valuelist';
    export const VALUELISTID = 'valuelistId';
    export const POSITION_VALUES = 'positionValues';
    export const POSITION_VALUELIST_ID = 'positionValuelistId';
}
