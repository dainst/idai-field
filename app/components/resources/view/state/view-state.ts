import {NavigationPath} from './navigation-path';

/**
 * @author Thomas Kleinke
 */
export interface ViewState {

    readonly mainTypeDocumentResourceId?: string;

    readonly displayHierarchy: boolean;
    readonly bypassOperationTypeSelection: boolean; // true means all mainTypeDocuments are selected. used when displayHierarchy is false.

    readonly layerIds: {[mainTypeDocumentId: string]: string[]};
    readonly navigationPaths: {[mainTypeDocumentId: string]: NavigationPath};
}


export class ViewState {

    public static default() {

        return {
            mode: 'map',
            displayHierarchy: true,
            bypassOperationTypeSelection: false,
            navigationPaths: {
                '_all': NavigationPath.empty()
            },
            layerIds: {}
        };
    };


    public static complete(viewState: ViewState) {

        if (!viewState.layerIds || Array.isArray(viewState.layerIds)) {
            (viewState as any).layerIds = {};
        } else {
            for (let key of Object.keys(viewState.layerIds)) {
                if (!Array.isArray(viewState.layerIds[key])) {
                    delete viewState.layerIds[key];
                }
            }
        }

        (viewState as any).displayHierarchy = true;
        (viewState as any).navigationPaths = {};
    }
}