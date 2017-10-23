import {Injectable} from '@angular/core';
import {ProjectConfiguration, RelationDefinition, ViewDefinition} from 'idai-components-2/configuration';
import {ReadDatastore} from 'idai-components-2/datastore';
import {Document} from 'idai-components-2/core';


@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class GeneralRoutingHelper {

    constructor(
        private projectConfiguration: ProjectConfiguration,
        private datastore: ReadDatastore
    ) {

    }


    public getMainTypeNameForDocument(document: Document): Promise<string> {

        const relations = document.resource.relations['isRecordedIn'];
        if (relations && relations.length > 0) {
            return this.datastore.get(relations[0]).then(mainTypeDocument => mainTypeDocument.resource.type);
        } else return Promise.resolve()
            .then(() => { // TODO exract method and rename to what it does accordingly and add doc why this special treatment is needed

                let relationDefinitions: Array<RelationDefinition>
                    = this.projectConfiguration.getRelationDefinitions(document.resource.type);
                let mainTypeName: string = '';

                for (let relationDefinition of relationDefinitions) {
                    if (relationDefinition.name == 'isRecordedIn') {
                        mainTypeName = relationDefinition.range[0];
                        break;
                    }
                }

                return Promise.resolve(mainTypeName);
            }).catch(() => {});
    }
}