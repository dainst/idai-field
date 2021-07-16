import { Relation } from '../../model/configuration/relation';


/**
 * @author Daniel de Oliveira
 */
export interface ConfigurationDefinition {

    identifier: string
    categories: any;
    relations: Array<Relation>;
    groups?: any;
}
