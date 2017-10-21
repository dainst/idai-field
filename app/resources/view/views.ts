import {Injectable} from '@angular/core';
import {Document} from 'idai-components-2/core';
import {ProjectConfiguration, RelationDefinition, ViewDefinition} from 'idai-components-2/configuration';
import {ReadDatastore} from 'idai-components-2/datastore';

@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class Views {


    constructor(private projectConfiguration: ProjectConfiguration, // TODO remove dependency
                private datastore: ReadDatastore) {}


    public getOperationViews() {

        if (!this.projectConfiguration.getViewsList()) return undefined;

        let views = [];
        for (let view of this.projectConfiguration.getViewsList()) {

            if (view.name == 'project') continue;
            views.push(view);
        }
        if (views.length < 1) return undefined;
        return views;
    }


    public getView(viewName) {

        return this.projectConfiguration.getView(viewName);
    }


    public getLabelForType(view) {

        return this.projectConfiguration.getLabelForType(view.mainType);
    }


    public getViewNameForMainTypeName(mainTypeName: string): string {

        const viewDefinitions: Array<ViewDefinition> = this.projectConfiguration.getViewsList();
        let viewName: string;
        for (let view of viewDefinitions) {
            if (view.mainType == mainTypeName) {
                viewName = view.name;
                break;
            }
        }

        return viewName;
    }


    /**
     * Gets a list of all the documents of types declared in the views array
     * of project documentation, except for the Project type document.
     *
     * @returns
     */
    public getOperationTypeDocuments(): Promise<Array<Document>> {

        let mainTypeDocuments: Array<Document> = [];
        let promises: Array<Promise<Array<Document>>> = [];

        return Promise.resolve().then(() => {

            for (let view of this.projectConfiguration.getViewsList()) {
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
}