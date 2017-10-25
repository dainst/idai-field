import {ViewDefinition} from 'idai-components-2/configuration';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class Views { // TODO get rid of everything project and Project, then rename to OperationViews


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


    public getViewName(viewName: string) {

        for (let view of this._) {
            if (view.name == viewName) return view;
        }
        return undefined;
    }


    public getView(viewName: string) {

        for (let view of this._) {
            if (view.name == viewName) return view;
        }
        return undefined;
    }


    public getLabelForName(name: any) {

        if (name == 'project') return 'Übersicht';

        for (let view of this._) {
            if (view.name == name) return view.mainTypeLabel;
        }
        return undefined;
    }


    public getTypeForName(name: any) {

        if (name == 'project') return 'Übersicht';

        for (let view of this._) {
            if (view.name == name) return view.operationSubtype;
        }
        return undefined;
    }


    public getViewNameForOperationTypeName(operationTypeName: string): string|undefined {

        const viewDefinitions: Array<ViewDefinition> = this._;
        let viewName: string|undefined = undefined;
        for (let view of viewDefinitions) {
            if (view.operationSubtype == operationTypeName) {
                viewName = view.name;
                break;
            }
        }

        return viewName;
    }
}