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

    /**
     * If set to true, a resource of this type can only be created inside another
     * resource which is of a type related to this resource's type via includes/liesWithin.
     */
    mustLieWithin?: true,

    fields: BuiltinFieldDefinitions;
}


export type BuiltinTypeDefinitions = { [typeName: string]: BuiltinTypeDefinition };


export type BuiltinFieldDefinitions = { [fieldName: string]: BuiltinFieldDefinition };


export interface BuiltinFieldDefinition extends BaseFieldDefinition {

    group?: string;
    valuelistFromProjectField?: string;
}