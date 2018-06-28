import {NavigationPath} from './navigation-path';

/**
 * @author Thomas Kleinke
 */
export interface ViewState {

    mainTypeDocumentResourceId?: string;

    displayHierarchy: boolean;
    bypassOperationTypeSelection: boolean; // true means all mainTypeDocuments are selected. used when displayHierarchy is false.

    layerIds: {[mainTypeDocumentId: string]: string[]};
    navigationPaths: {[mainTypeDocumentId: string]: NavigationPath};
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
            viewState.layerIds = {};
        } else {
            for (let key of Object.keys(viewState.layerIds)) {
                if (!Array.isArray(viewState.layerIds[key])) {
                    delete viewState.layerIds[key];
                }
            }
        }

        viewState.displayHierarchy = true;
        viewState.navigationPaths = {};
    }
}