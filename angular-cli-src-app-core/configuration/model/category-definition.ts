/**
 * CategoryDefinition, as used in ProjectConfiguration
 *
 * @author Daniel de Oliveira
 */
export interface CategoryDefinition {

    name: string;
    label?: string;
    description: { [language: string]: string };
    abstract?: boolean;

    /**
     * @see BuiltinTypeDefinition
     */
    mustLieWithin?: true,

    fields?: any;
    parent?: string;
    color?: string;
    libraryId?: string;
}


export module CategoryDefinition {

    export const FIELDS = 'fields';
    export const PARENT = 'parent';
}