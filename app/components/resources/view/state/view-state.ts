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
    mode: 'map' | 'list';

    bypassHierarchy: boolean;
    groupSectionsShouldStayOpenAllTheTime: boolean;
    searchContext: ViewContext;
    customConstraints: { [name: string]: string }
}


export module ViewState {

    export function default_(): ViewState {

        return {
            operation: undefined,
            bypassHierarchy: false,
            groupSectionsShouldStayOpenAllTheTime: false,
            navigationPath: NavigationPath.empty(),
            mode: 'map',
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
        viewState.groupSectionsShouldStayOpenAllTheTime = false;
        viewState.bypassHierarchy = false;
        viewState.searchContext = ViewContext.empty();
        viewState.navigationPath = NavigationPath.empty();
        viewState.customConstraints = {};
    }
}