/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
import {ViewDefinition} from './view-definition';

export class OperationViews {


    constructor(
        private _: ViewDefinition[]
    ) {
        if (!_) _ = [];
    }


    public get() {

        return this._;
    }


    public getLabelForName(name: string) {

        const view = this.namedView(name);
        return (view) ? view.label : undefined;
    }


    public getOperationSubtypeForViewName(name: string): string|undefined {

        const view = this.namedView(name);
        return (view) ? view.operationSubtype : undefined;
    }


    private namedView = (name: string) => this._.find(this.sameViewName(name));


    private sameViewName = (name: string) => (view: any) => name == view.name;


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