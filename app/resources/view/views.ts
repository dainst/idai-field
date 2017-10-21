import {Document} from 'idai-components-2/core';
import {ViewDefinition} from 'idai-components-2/configuration';
import {Datastore} from 'idai-components-2/datastore';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class Views {


    constructor(
        private _: any
    ) {}


    public getOperationViews() {

        if (!this._) return [];

        let views = [];
        for (let view of this._) {

            if (view.name == 'project') continue;
            views.push(view);
        }
        if (views.length < 1) return [];
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
}