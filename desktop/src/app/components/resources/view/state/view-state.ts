import { FieldDocument } from 'idai-field-core';
import { NavigationPath } from './navigation-path';
import { ViewContext } from './view-context';
import { ResourcesViewMode } from '../view-facade';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export interface ViewState {

    operation: FieldDocument|undefined;
    layerIds?: string[];
    navigationPath: NavigationPath;
    mode: ResourcesViewMode;

    // Extended search mode. The name bypassHierarchy is legacy and is kept to prevent issues with existing
    // config.json files.
    bypassHierarchy: boolean;

    limitSearchResults: boolean;
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
            limitSearchResults: true,
            searchContext: ViewContext.empty(),
            customConstraints: {}
        };
    }


    export function complete(viewState: ViewState) {

        if (!Array.isArray(viewState.layerIds)) delete viewState.layerIds;

        if (!viewState.mode) viewState.mode = 'map';
        if (viewState.expandAllGroups === undefined) viewState.expandAllGroups = false;
        if (viewState.limitSearchResults === undefined) viewState.limitSearchResults = true;
        viewState.bypassHierarchy = false;
        viewState.searchContext = ViewContext.empty();
        viewState.navigationPath = NavigationPath.empty();
        viewState.customConstraints = {};
    }
}
