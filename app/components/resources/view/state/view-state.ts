import {NavigationPath} from './navigation-path';
import {ViewContext} from "./view-context";

/**
 * @author Thomas Kleinke
 */
export interface ViewState {

    readonly mainTypeDocumentResourceId?: string;

    readonly layerIds: {[mainTypeDocumentId: string]: string[]};
    readonly navigationPaths: {[mainTypeDocumentId: string]: NavigationPath};

    // bypassHierarchy (search mode) related

    readonly bypassHierarchy: boolean;
    readonly selectAllOperationsOnBypassHierarchy: boolean;

    readonly searchContext: ViewContext;

    // -
}


export class ViewState {

    public static default() {

        return {
            mode: 'map',
            bypassHierarchy: false,
            selectAllOperationsOnBypassHierarchy: false,
            navigationPaths: {
                '_all': NavigationPath.empty()
            },
            layerIds: {},
            searchContext: ViewContext.empty()
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

        (viewState as any).bypassHierarchy = false;
        (viewState as any).searchContext = ViewContext.empty();
        (viewState as any).navigationPaths = {
            '_all': NavigationPath.empty()
        };
    }
}