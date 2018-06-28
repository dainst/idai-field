import {IdaiFieldDocument} from 'idai-components-2/field';
import {ViewState} from './view-state';
import {ObjectUtil} from '../../../../util/object-util';
import {NavigationPath} from './navigation-path';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export interface ResourcesState { // 'the' resources state

    viewStates: { [viewName: string]: ViewState };
    view: string;
    mode: 'map' | 'list';
    activeDocumentViewTab: string|undefined;
}


export module ResourcesState {


    export function getQueryString(state: ResourcesState) {

        return NavigationPath.getQuerySring(getNavPath(state), getDisplayHierarchy(state));
    }


    export function getTypeFilters(state: ResourcesState) {

        return NavigationPath.getTypeFilters(getNavPath(state), getDisplayHierarchy(state));
    }


    export function getSelectedDocument(state: ResourcesState) {

        return NavigationPath.getSelectedDocument(getNavPath(state), getDisplayHierarchy(state));
    }


    export function getNavPath(state: ResourcesState): NavigationPath {

        const mainTypeDocumentResourceId = state.viewStates[state.view].mainTypeDocumentResourceId;
        if (!mainTypeDocumentResourceId) return NavigationPath.empty();

        const path = state.viewStates[state.view].navigationPaths[mainTypeDocumentResourceId];
        return path ? path : NavigationPath.empty();
    }


    export function getBypassOperationTypeSelection(state: ResourcesState): boolean {

        return state.viewStates[state.view].bypassOperationTypeSelection;
    }


    export function getDisplayHierarchy(state: ResourcesState): boolean {

        return state.viewStates[state.view].displayHierarchy;
    }


    export function getMainTypeDocumentResourceId(state: ResourcesState): string|undefined {

        return state.viewStates[state.view].mainTypeDocumentResourceId;
    }


    export function getActiveLayersIds(state: ResourcesState): string[] {

        const mainTypeDocumentResourceId = getMainTypeDocumentResourceId(state);
        if (!mainTypeDocumentResourceId) return [];

        const layersIds = state.viewStates[state.view].layerIds[mainTypeDocumentResourceId];
        return layersIds ? layersIds : [];
    }


    export function getLayerIds(state: ResourcesState): {[mainTypeDocumentId: string]: string[]} {

        return state.viewStates[state.view].layerIds;
    }


    export function setQueryString(state: ResourcesState, q: string): ResourcesState {

        return updateNavigationPath(state, NavigationPath.setQueryString(getNavPath(state),
            getDisplayHierarchy(state), q));
    }


    export function setTypeFilters(state: ResourcesState, types: string[]): ResourcesState {

        return updateNavigationPath(state, NavigationPath.setTypeFilters(getNavPath(state),
            getDisplayHierarchy(state), types));
    }


    export function setSelectedDocument(state: ResourcesState, document: IdaiFieldDocument|undefined): ResourcesState {

        return updateNavigationPath(state, NavigationPath.setSelectedDocument(getNavPath(state),
            state.viewStates[state.view].displayHierarchy, document));
    }


    export function setActiveLayerIds(state: ResourcesState, activeLayersIds: string[]): ResourcesState {

        const cloned = ObjectUtil.cloneObject(state);

        const mainTypeDocumentResourceId = getMainTypeDocumentResourceId(cloned);
        if (!mainTypeDocumentResourceId) return cloned;

        cloned.viewStates[cloned.view].layerIds[mainTypeDocumentResourceId] = activeLayersIds.slice(0);
        return cloned;
    }


    export function removeActiveLayersIds(state: ResourcesState): ResourcesState {

        const cloned = ObjectUtil.cloneObject(state);

        const mainTypeDocumentResourceId = getMainTypeDocumentResourceId(cloned);
        if (mainTypeDocumentResourceId) delete cloned.viewStates[cloned.view].layerIds[mainTypeDocumentResourceId];

        return cloned;
    }


    export function updateNavigationPath(state: ResourcesState, navPath: NavigationPath): ResourcesState {

        const cloned = ObjectUtil.cloneObject(state);

        const mainTypeDocumentResourceId = getMainTypeDocumentResourceId(cloned);
        if (!mainTypeDocumentResourceId) return cloned;

        cloned.viewStates[cloned.view].navigationPaths[mainTypeDocumentResourceId] = navPath;
        return cloned;
    }


    export function makeSampleDefaults(): ResourcesState {

        return {
            viewStates: {
                project: {
                    layerIds: {'test': ['o25']},
                    displayHierarchy: true,
                    bypassOperationTypeSelection: false,
                    navigationPaths: {}
                },
                excavation: {
                    displayHierarchy: true,
                    bypassOperationTypeSelection: false,
                    navigationPaths: {'t1': NavigationPath.empty()},
                    layerIds: {'t1': ['o25']}
                }
            },
            view: 'project',
            mode: 'map',
            activeDocumentViewTab: undefined
        }
    }


    export function makeDefaults(): ResourcesState {

        return {
            viewStates: {
                excavation: ViewState.default(),
                project: ViewState.default()
            },
            view: 'project',
            mode: 'map',
            activeDocumentViewTab: undefined
        };
    }


    export function complete(state: ResourcesState ): ResourcesState {

        Object.keys(state.viewStates)
            .forEach(viewName => ViewState.complete(state.viewStates[viewName]));
        return state; // TODO return copy
    }


    export function setDisplayHierarchy(state: ResourcesState, displayHierarchy: boolean): ResourcesState {

        const cloned = ObjectUtil.cloneObject(state);
        cloned.viewStates[cloned.view].displayHierarchy = displayHierarchy;
        return cloned;
    }


    export function setBypassOperationTypeSelection(state: ResourcesState, bypassOperationTypeSelection: boolean): ResourcesState {

        const cloned = ObjectUtil.cloneObject(state);
        cloned.viewStates[cloned.view].bypassOperationTypeSelection = bypassOperationTypeSelection;
        return cloned;
    }
}

