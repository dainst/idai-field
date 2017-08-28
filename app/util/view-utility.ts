import {Injectable} from '@angular/core';
import {Document} from 'idai-components-2/core';
import {ConfigLoader, RelationDefinition, ViewDefinition} from 'idai-components-2/configuration';
import {ReadDatastore} from 'idai-components-2/datastore';

@Injectable()
/**
 * @author Thomas Kleinke
 */
export class ViewUtility {

    constructor(private configLoader: ConfigLoader,
                private datastore: ReadDatastore) {}

    public getMainTypeNameForDocument(document: Document): Promise<string> {

        const relations = document.resource.relations['isRecordedIn'];
        if (relations && relations.length > 0) {
            return this.datastore.get(relations[0]).then(mainTypeDocument => mainTypeDocument.resource.type);
        } else return this.configLoader.getProjectConfiguration()
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

        if (document.resource.type == 'Project') return Promise.resolve('project');

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

    public getMainTypeDocuments(): Promise<Array<Document>> {

        let mainTypeDocuments: Array<Document> = [];
        let promises: Array<Promise<Array<Document>>> = [];

        return this.configLoader.getProjectConfiguration().then(projectConfiguration => {

            for (let view of projectConfiguration.getViewsList()) {
                if (view.mainType == 'Project') continue;
                let promise = this.datastore.find({ q: '', types: [view.mainType] })
                    .then(documents => mainTypeDocuments = mainTypeDocuments.concat(documents));
                promises.push(promise);
            }

            return Promise.all(promises).then(
                () => Promise.resolve(mainTypeDocuments),
                msgWithParams => Promise.reject(msgWithParams)
            );
        });
    }

    public getMainTypeDocumentLabel(document: Document): string {

        if (document.resource.shortDescription) {
            return document.resource.shortDescription + ' (' + document.resource.identifier + ')';
        } else {
            return document.resource.identifier;
        }
    }
}