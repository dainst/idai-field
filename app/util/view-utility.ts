import {Injectable} from '@angular/core';
import {Document} from 'idai-components-2/core';
import {ConfigLoader, RelationDefinition, ViewDefinition} from 'idai-components-2/configuration';

@Injectable()
/**
 * @author Thomas Kleinke
 */
export class ViewUtility {

    constructor(private configLoader: ConfigLoader) {}

    public getMainTypeNameForDocument(document: Document): Promise<string> {

        return this.configLoader.getProjectConfiguration()
            .then(projectConfiguration => {

                let relationDefinitions: Array<RelationDefinition>
                    = projectConfiguration.getRelationDefinitions(document.resource.type);
                let mainTypeName: string;

                for (let relationDefinition of relationDefinitions) {
                    if (relationDefinition.name == 'isRecordedIn') {
                        mainTypeName = relationDefinition.range[0];
                        break;
                    }
                }

                return Promise.resolve(mainTypeName);
            }).catch(() => {});
    }

    public getViewNameForDocument(document: Document): Promise<string> {

        let mainTypeName: string;

        return this.getMainTypeNameForDocument(document)
            .then(name => {
                mainTypeName = name;
                return this.configLoader.getProjectConfiguration();
            }).then(projectConfiguration => {
                let viewDefinitions: Array<ViewDefinition> = projectConfiguration.getViewsList();
                let viewName: string;

                for (let view of viewDefinitions) {
                    if (view.mainType == mainTypeName) {
                        viewName = view.name;
                        break;
                    }
                }

                return Promise.resolve(viewName);
             }).catch(() => {});
    }
}