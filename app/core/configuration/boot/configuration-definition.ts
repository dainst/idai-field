import {CategoryDefinition} from '../model/category-definition';
import {RelationDefinition} from '../model/relation-definition';

/**
 * @author Daniel de Oliveira
 */
export interface ConfigurationDefinition {

    identifier: string
    categories: Array<CategoryDefinition>;
    relations: Array<RelationDefinition>;
    groups?: any;
}