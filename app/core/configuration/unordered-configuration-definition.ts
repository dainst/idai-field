import {TypeDefinition} from 'idai-components-2';
import {RelationDefinition} from 'idai-components-2';

/**
 * @author Thomas Kleinke
 */
export interface UnorderedConfigurationDefinition {

    identifier: string
    types: { [typeName: string]: TypeDefinition };
    relations: Array<RelationDefinition>;
}