import {ViewDefinition} from 'idai-components-2/configuration';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class OperationViews {


    constructor(
        private _: any
    ) {}


    public getOperationViews() {

        if (!this._) return [];

        let views = [] as any;
        for (let view of this._) {

            views.push(view as never);
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

        for (let view of this._) {
            if (view.name == name) return view.mainTypeLabel;
        }
        return undefined;
    }


    public getTypeForName(name: any) {

        for (let view of this._) {
            if (view.name == name) return view.operationSubtype;
        }
        return undefined;
    }


    public getViewNameForOperationSubtype(operationSubtypeName: string): string|undefined {

        const viewDefinitions: Array<ViewDefinition> = this._;
        let viewName: string|undefined = undefined;
        for (let view of viewDefinitions) {
            if (view.operationSubtype == operationSubtypeName) {
                viewName = view.name;
                break;
            }
        }

        return viewName;
    }
}