/**
 * TypeDefinition, as used in ProjectConfiguration
 *
 * @author Daniel de Oliveira
 */
export interface TypeDefinition {

    label?: string;
    type: string;
    abstract?: boolean;
    fields?: any;
    parent?: string;
    color?: string;
}