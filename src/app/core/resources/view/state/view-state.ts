import {FieldDocument} from 'idai-components-2';
import {NavigationPath} from './navigation-path';
import {ViewContext} from './view-context';
import {ResourcesViewMode} from '../view-facade';


export const DEFAULT_LIMIT: number = 1000;


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export interface ViewState {

    operation: FieldDocument|undefined;
    layerIds: string[];
    navigationPath: NavigationPath;
    mode: ResourcesViewMode;

    // Extended search mode. The name bypassHierarchy is legacy and is kept to prevent issues with existing
    // config.json files.
    bypassHierarchy: boolean;

    // Used in extended search mode
    limit: number;

    expandAllGroups: boolean;
    searchContext: ViewContext;
    customConstraints: { [name: string]: string }
}


export module ViewState {

    export function build(mode: ResourcesViewMode = 'map'): ViewState {

        return {
            operation: undefined,
            bypassHierarchy: false,
            expandAllGroups: false,
            navigationPath: NavigationPath.empty(),
            mode: mode,
            limit: DEFAULT_LIMIT,
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
        if (viewState.limit === undefined) viewState.limit = DEFAULT_LIMIT;
        viewState.bypassHierarchy = false;
        viewState.searchContext = ViewContext.empty();
        viewState.navigationPath = NavigationPath.empty();
        viewState.customConstraints = {};
    }
}
