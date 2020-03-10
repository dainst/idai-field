import {Map} from 'tsfun';
import {BuiltinFieldDefinition} from './builtin-type-definition';
import {LibraryFieldDefinition, LibraryTypeDefinition} from './library-type-definition';


export interface TransientTypeDefinition extends BuiltinFieldDefinition, LibraryTypeDefinition {

    fields: Map<TransientFieldDefinition>;
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
