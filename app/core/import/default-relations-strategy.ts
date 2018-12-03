import {RelationsCompleter} from './relations-completer';
import {RelationsStrategy} from './relations-strategy';
import {DocumentDatastore} from '../datastore/document-datastore';
import {ProjectConfiguration} from 'idai-components-2/src/configuration/project-configuration';

/**
 * @author Thomas Kleinke
 */
export class DefaultRelationsStrategy implements RelationsStrategy {

    constructor(private datastore: DocumentDatastore,
                private projectConfiguration: ProjectConfiguration,
                private username: string) { }


    completeInverseRelations(resourceIds: string[]): Promise<any> {

        return RelationsCompleter.completeInverseRelations(
            this.datastore, this.projectConfiguration, this.username, resourceIds);
    }


    resetInverseRelations(resourceIds: string[]): Promise<any> {

        return RelationsCompleter.resetInverseRelations(
            this.datastore, this.projectConfiguration, this.username, resourceIds);
    }
}