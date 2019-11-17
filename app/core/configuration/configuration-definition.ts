import {TypeDefinition} from './model/type-definition';
import {RelationDefinition} from './model/relation-definition';

/**
 * @author Daniel de Oliveira
 */
export interface ConfigurationDefinition {
    identifier: string
    types: Array<TypeDefinition>;
    relations: Array<RelationDefinition>;
}