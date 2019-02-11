import {FieldDocument} from 'idai-components-2';
import {ViewState} from './view-state';
import {NavigationPath} from './navigation-path';
import {ViewContext} from './view-context';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export interface ResourcesState { // 'the' resources state

    overviewState: ViewState;
    operationViewStates: { [operationId: string]: ViewState };

    view: 'project' | string; // <- active view state

    mode: 'map' | 'list';
    activeDocumentViewTab: string|undefined;
}


export module ResourcesState {

    export function getQueryString(state: ResourcesState) {

        return viewState(state).bypassHierarchy
            ? viewState(state).searchContext.q
            : NavigationPath.getQueryString(getNavigationPath(state));
    }


    export function getTypeFilters(state: ResourcesState) {

        return viewState(state).bypassHierarchy
            ? viewState(state).searchContext.types
            : NavigationPath.getTypeFilters(getNavigationPath(state));
    }


    export function getCustomConstraints(state: ResourcesState) {

        return viewState(state).bypassHierarchy
            ? viewState(state).customConstraints
            : {};
    }


    export function getSelectedDocument(state: ResourcesState): FieldDocument|undefined {

        return viewState(state).bypassHierarchy
            ? viewState(state).searchContext.selected
            : NavigationPath.getSelectedDocument(getNavigationPath(state));
    }


    export function getNavigationPath(state: ResourcesState): NavigationPath {

        const path: NavigationPath = viewState(state).navigationPath;
        return path ? path : NavigationPath.empty();
    }


    export function getSelectAllOperationsOnBypassHierarchy(state: ResourcesState): boolean {

        throw "not implemented";
        // return viewState(state).selectAllOperationsOnBypassHierarchy;
    }


    export function getBypassHierarchy(state: ResourcesState): boolean {

        return viewState(state).bypassHierarchy;
    }


    export function getActiveLayersIds(state: ResourcesState): string[] {

        // if (!mainTypeDocumentResourceId) return [];

        // const layersIds = viewState(state).layerIds[isAllSelection(viewState(state)) ? '_all' : mainTypeDocumentResourceId];
        const layersIds = viewState(state).layerIds;
        return layersIds ? layersIds : [];
    }


    export function setActiveDocumentViewTab(state: ResourcesState, activeDocumentViewTab: string|undefined): ResourcesState {

        state.activeDocumentViewTab = activeDocumentViewTab;
        return state;
    }


    export function setMode(state: ResourcesState, mode: 'map' | 'list'): ResourcesState {

        state.mode = mode;
        return state;
    }


    export function setQueryString(state: ResourcesState, q: string) {

        if (viewState(state).bypassHierarchy) {
            (viewState(state).searchContext as any).q = q;
        } else {
            updateNavigationPath(state, NavigationPath.setQueryString(getNavigationPath(state), q));
        }
    }


    export function setTypeFilters(state: ResourcesState, types: string[]) {

        if (viewState(state).bypassHierarchy) {
            (viewState(state).searchContext as any).types = types;
        } else {
            updateNavigationPath(state, NavigationPath.setTypeFilters(getNavigationPath(state), types));
        }
    }


    export function setCustomConstraints(state: ResourcesState,
                                         constraints: { [name: string]: string}): ResourcesState {

        (viewState(state) as any).customConstraints = constraints;
        return state;
    }


    export function setSelectedDocument(state: ResourcesState,
                                        document: FieldDocument|undefined) {

        if (viewState(state).bypassHierarchy) {
            (viewState(state).searchContext as any).selected = document;
        } else {
            updateNavigationPath(state, NavigationPath.setSelectedDocument(getNavigationPath(state), document));
        }
    }


    export function setActiveLayerIds(state: ResourcesState, activeLayersIds: string[]) {

        // const layerContextId = isAllSelection(viewState(state)) ? '_all' : mainTypeDocumentResourceId;
        viewState(state).layerIds = activeLayersIds.slice(0);
    }


    export function removeActiveLayersIds(state: ResourcesState) {

        delete viewState(state).layerIds;
    }


    export function updateNavigationPath(state: ResourcesState, navPath: NavigationPath) {

        viewState(state).navigationPath = navPath;
    }


    export function makeSampleDefaults(): ResourcesState {

        return makeDefaults();
        // return {
        //     operationViewStates: {
        //         project: {
        //             layerIds: { 'project': ['o25'] },
        //             bypassHierarchy: false,
        //             selectAllOperationsOnBypassHierarchy: false,
        //             navigationPaths: {},
        //             searchContext: ViewContext.empty(),
        //             customConstraints: {}
        //         },
        //         excavation: {
        //             bypassHierarchy: false,
        //             selectAllOperationsOnBypassHierarchy: false,
        //             navigationPaths: {
        //                 't1': NavigationPath.empty()
        //             },
        //             layerIds: { 't1': ['o25'] },
        //             searchContext: ViewContext.empty(),
        //             customConstraints: {}
        //         }
        //     },
        //     view: 'project',
        //     mode: 'map',
        //     activeDocumentViewTab: undefined
        // }
    }


    export function makeDefaults(): ResourcesState {

        return {
            overviewState: ViewState.default(),
            operationViewStates: {},
            view: 'project',
            mode: 'map',
            activeDocumentViewTab: undefined
        };
    }


    export function complete(state: ResourcesState ): ResourcesState {

        Object.keys(state.operationViewStates)
            .forEach(viewName => ViewState.complete(state.operationViewStates[viewName]));
        return state;
    }


    export function setBypassHierarchy(state: ResourcesState, bypassHierarchy: boolean): ResourcesState {

        (viewState(state) as any).bypassHierarchy = bypassHierarchy;
        return state;
    }


    export function setMainTypeDocumentResourceId(state: ResourcesState,
                                                  mainTypeDocumentResourceId: string|undefined): ResourcesState {

        (viewState(state) as any).mainTypeDocumentResourceId = mainTypeDocumentResourceId;
        (viewState(state) as any).searchContext.selected = undefined;
        return state;
    }


    export function setSelectAllOperationsOnBypassHierarchy(state: ResourcesState, selectAllOperationsOnBypassHierarchy: boolean): ResourcesState {

        (viewState(state) as any).selectAllOperationsOnBypassHierarchy = selectAllOperationsOnBypassHierarchy;
        if (selectAllOperationsOnBypassHierarchy) {
            (viewState(state) as any).searchContext.selected = undefined;
        }
        return state;
    }


    function isAllSelection(viewState: ViewState): boolean {

        return false;
        // return viewState.bypassHierarchy;
            // && viewState.selectAllOperationsOnBypassHierarchy;
    }


    function viewState(state: ResourcesState): ViewState {

        return state.view === 'project'
            ? state.overviewState
            : state.operationViewStates[state.view];
    }
}

