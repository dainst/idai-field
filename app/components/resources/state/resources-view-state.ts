import {NavigationPath} from './navigation-path';


/**
 * @author Thomas Kleinke
 */
export interface ResourcesViewState {

    mainTypeDocumentResourceId?: string;
    displayHierarchy: boolean;
    layerIds: {[mainTypeDocumentId: string]: string[]};
    navigationPaths: {[mainTypeDocumentId: string]: NavigationPath};
}


export class ResourcesViewState {

    public static default() {

        return {
            mode: 'map',
            displayHierarchy: true,
            navigationPaths: {},
            layerIds: {}
        };
    };


    public static complete(viewState: ResourcesViewState) {

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