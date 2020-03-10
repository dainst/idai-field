import {Map} from 'tsfun';
import {BuiltinFieldDefinition} from './builtin-type-definition';
import {LibraryFieldDefinition, LibraryTypeDefinition} from './library-type-definition';


export interface TransientTypeDefinition extends BuiltinFieldDefinition, LibraryTypeDefinition {

    fields: Map<TransientFieldDefinition>;
}


export module TransientTypeDefinition {

    export const FIELDS = 'fields';
    export const COMMONS = 'commons';
}


export interface TransientFieldDefinition extends BuiltinFieldDefinition, LibraryFieldDefinition {

    valuelist?: any;
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
}