import {FieldDocument} from 'idai-components-2';
import {NavigationPath} from './navigation-path';
import {ViewContext} from './view-context';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export interface ViewState {

    operation: FieldDocument|undefined;
    layerIds: string[];
    layer3DIds: string[];
    navigationPath: NavigationPath;
    mode: 'map'|'3dMap'|'list';

    bypassHierarchy: boolean;
    expandAllGroups: boolean;
    searchContext: ViewContext;
    customConstraints: { [name: string]: string }
}


export module ViewState {

    export function default_(): ViewState {

        return {
            operation: undefined,
            bypassHierarchy: false,
            expandAllGroups: false,
            navigationPath: NavigationPath.empty(),
            mode: 'map',
            layerIds: [],
            layer3DIds: [],
            searchContext: ViewContext.empty(),
            customConstraints: {}
        };
    }


    export function complete(viewState: ViewState) {

        if (!viewState.layerIds || !Array.isArray(viewState.layerIds)) {
            viewState.layerIds = [];
        }

        if (!viewState.layer3DIds || !Array.isArray(viewState.layer3DIds)) {
            viewState.layer3DIds = [];
        }

        if (!viewState.mode) viewState.mode = 'map';
        if (viewState.expandAllGroups === undefined) viewState.expandAllGroups = false;
        viewState.bypassHierarchy = false;
        viewState.searchContext = ViewContext.empty();
        viewState.navigationPath = NavigationPath.empty();
        viewState.customConstraints = {};
    }
}