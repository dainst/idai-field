/**
 * TypeDefinition, as used in ProjectConfiguration
 *
 * @author Daniel de Oliveira
 */
export interface TypeDefinition {

    label?: string;
    type: string;
    abstract?: boolean;

    /**
     * @see BuiltinTypeDefinition
     */
    mustLieWithin?: true,

    fields?: any;
    parent?: string;
    color?: string;
}


export module TypeDefinition {

    export const FIELDS = 'fields';
    export const PARENT = 'parent';
}