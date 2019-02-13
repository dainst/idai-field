import {FieldDocument} from 'idai-components-2';
import {NavigationPath} from './navigation-path';
import {ViewContext} from './view-context';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export interface ViewState {

    active: boolean;

    operation: FieldDocument|undefined;
    layerIds: string[];
    navigationPath: NavigationPath;
    mode: 'map' | 'list';

    bypassHierarchy: boolean;
    searchContext: ViewContext;
    customConstraints: { [name: string]: string }
}


export class ViewState {

    public static default(): ViewState {

        return {
            active: false,
            operation: undefined,
            bypassHierarchy: false,
            navigationPath: NavigationPath.empty(),
            mode: 'map',
            layerIds: [],
            searchContext: ViewContext.empty(),
            customConstraints: {}
        };
    };


    public static complete(viewState: ViewState) {

        if (!viewState.layerIds || !Array.isArray(viewState.layerIds)) {
            viewState.layerIds = [];
        }

        if (!viewState.mode) viewState.mode = 'map';
        viewState.bypassHierarchy = false;
        viewState.searchContext = ViewContext.empty();
        viewState.navigationPath = NavigationPath.empty();
        viewState.customConstraints = {};
    }
}