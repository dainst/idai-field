import {TypeDefinition} from 'idai-components-2';
import {RelationDefinition} from 'idai-components-2';

/**
 * @author Daniel de Oliveira
 */
export interface ConfigurationDefinition {
    identifier: string
    types: Array<TypeDefinition>;
    relations: Array<RelationDefinition>;
}