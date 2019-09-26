import {BaseFieldDefinition, BaseTypeDefinition} from "./base-type-definition";


/**
 * TypeDefinition, as used in AppConfigurator
 *
 * @author Daniel de Oliveira
 */

export interface BuiltinTypeDefinition extends BaseTypeDefinition {

    parent?: string;
    abstract?: boolean;
    commons?: string[];
    superType?: boolean,
    userDefinedSubtypesAllowed?: boolean,
    fields: BuiltinFieldDefinitions;
}


export type BuiltinTypeDefinitions = { [typeName: string]: BuiltinTypeDefinition };


export type BuiltinFieldDefinitions = { [fieldName: string]: BuiltinFieldDefinition };


export interface BuiltinFieldDefinition extends BaseFieldDefinition {

    group?: string;
}