import {TypeDefinition} from './type-definition';
import {RelationDefinition} from './relation-definition';

/**
 * @author Thomas Kleinke
 */
export interface UnorderedConfigurationDefinition {

    identifier: string
    types: { [typeName: string]: TypeDefinition };
    relations: Array<RelationDefinition>;
}