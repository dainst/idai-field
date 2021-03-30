import {RelationDefinition} from 'idai-field-core';

/**
 * @author Daniel de Oliveira
 */
export interface ConfigurationDefinition {

    identifier: string
    categories: any;
    relations: Array<RelationDefinition>;
    groups?: any;
}
