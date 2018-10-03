import {NavigationPath} from './navigation-path';
import {ViewContext} from './view-context';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export interface ViewState {

    readonly mainTypeDocumentResourceId?: string;

    readonly layerIds: {[mainTypeDocumentId: string]: string[]};
    readonly layer3DIds: {[mainTypeDocumentId: string]: string[]};
    readonly navigationPaths: {[mainTypeDocumentId: string]: NavigationPath};

    // bypassHierarchy (search mode) related
    readonly bypassHierarchy: boolean;
    readonly selectAllOperationsOnBypassHierarchy: boolean;
    readonly searchContext: ViewContext;
    readonly customConstraints: { [name: string]: string }
}


export class ViewState {

    public static default() {

        return {
            mode: 'map',
            bypassHierarchy: false,
            selectAllOperationsOnBypassHierarchy: false,
            navigationPaths: {},
            layerIds: {},
            layer3DIds: {},
            searchContext: ViewContext.empty(),
            customConstraints: {}
        };
    };


    public static complete(viewState: ViewState) {

        this.validateLayerIds(viewState, 'layerIds');
        this.validateLayerIds(viewState, 'layer3DIds');

        (viewState as any).bypassHierarchy = false;
        (viewState as any).searchContext = ViewContext.empty();
        (viewState as any).navigationPaths = {};
        (viewState as any).customConstraints = {};
    }


    private static validateLayerIds(viewState: ViewState, fieldName: 'layerIds'|'layer3DIds') {

        if (!viewState[fieldName] || Array.isArray(viewState[fieldName])) {
            (viewState as any)[fieldName] = {};
        } else {
            for (let key of Object.keys(viewState[fieldName])) {
                if (!Array.isArray(viewState[fieldName][key])) {
                    delete viewState[fieldName][key];
                }
            }
        }
    }
}