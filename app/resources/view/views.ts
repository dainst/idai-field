import {Document} from 'idai-components-2/core';
import {ViewDefinition} from 'idai-components-2/configuration';
import {Datastore} from 'idai-components-2/datastore';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class Views {


    constructor(
        private datastore: Datastore, // TODO get rid of dependency
        private _: any
    ) {}


    public getOperationViews() {

        if (!this._) return undefined;

        let views = [];
        for (let view of this._) {

            if (view.name == 'project') continue;
            views.push(view);
        }
        if (views.length < 1) return undefined;
        return views;
    }


    public getView(viewName) {

        for (let view of this._) {
            if (view.name == viewName) return view;
        }
        return undefined;
    }


    public getLabelForType(mainType) {

        for (let view of this._) {
            if (view.mainType == mainType) return view.mainTypeLabel;
        }
        return undefined;
    }


    public getViewNameForMainTypeName(mainTypeName: string): string {

        const viewDefinitions: Array<ViewDefinition> = this._;
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
    public getOperationTypeDocuments(): Promise<Array<Document>> { // TODO return just the operatonTypeNames. There is no reason at all why fetching the docs should be the responsibiltiy of views

        let mainTypeDocuments: Array<Document> = [];
        let promises: Array<Promise<Array<Document>>> = [];

        return Promise.resolve().then(() => {

            for (let view of this._) {
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