import {CategoryDefinition} from './category-definition';
import {RelationDefinition} from './relation-definition';

/**
 * @author Thomas Kleinke
 */
export interface UnorderedConfigurationDefinition {

    identifier: string
    categories: { [categoryName: string]: CategoryDefinition };
    relations: Array<RelationDefinition>;
}