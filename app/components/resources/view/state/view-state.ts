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
    navigationPath: NavigationPath;
    mode: 'map'|'list'|'types';

    // Extended search mode. The name bypassHierarchy is legacy and is kept to prevent issues with existing
    // config.json files.
    bypassHierarchy: boolean;

    expandAllGroups: boolean;
    searchContext: ViewContext;
    customConstraints: { [name: string]: string }
}


export module ViewState {

    export function build(mode: 'map'|'list'|'types' = 'map'): ViewState {

        return {
            operation: undefined,
            bypassHierarchy: false,
            expandAllGroups: false,
            navigationPath: NavigationPath.empty(),
            mode: mode,
            layerIds: [],
            searchContext: ViewContext.empty(),
            customConstraints: {}
        };
    }


    export function complete(viewState: ViewState) {

        if (!viewState.layerIds || !Array.isArray(viewState.layerIds)) {
            viewState.layerIds = [];
        }

        if (!viewState.mode) viewState.mode = 'map';
        if (viewState.expandAllGroups === undefined) viewState.expandAllGroups = false;
        viewState.bypassHierarchy = false;
        viewState.searchContext = ViewContext.empty();
        viewState.navigationPath = NavigationPath.empty();
        viewState.customConstraints = {};
    }
}