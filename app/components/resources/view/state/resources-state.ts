import {FieldDocument} from 'idai-components-2';
import {ViewState} from './view-state';
import {NavigationPath} from './navigation-path';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export interface ResourcesState { // 'the' resources state

    overviewState: ViewState;
    operationViewStates: { [operationId: string]: ViewState };
    view: 'project' | string; // <- active view state
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


    export function getCurrentOperation(state: ResourcesState): FieldDocument|undefined {

        return viewState(state).operation;
    }


    export function getSelectAllOperationsOnBypassHierarchy(state: ResourcesState): boolean {

        throw "not implemented";
    }


    export function getBypassHierarchy(state: ResourcesState): boolean {

        return viewState(state).bypassHierarchy;
    }


    export function getActiveLayersIds(state: ResourcesState): string[] {

        const layersIds = viewState(state).layerIds;
        return layersIds ? layersIds : [];
    }


    export function getMode(state: ResourcesState): 'map'|'list' {

        return viewState(state).mode;
    }


    export function setActiveDocumentViewTab(state: ResourcesState, activeDocumentViewTab: string|undefined) {

        state.activeDocumentViewTab = activeDocumentViewTab;
    }


    export function setQueryString(state: ResourcesState, q: string) {

        if (viewState(state).bypassHierarchy) {
            (viewState(state).searchContext as any).q = q;
        } else {
            NavigationPath.setQueryString(getNavigationPath(state), q);
            updateNavigationPath(state, getNavigationPath(state));
        }
    }


    export function setTypeFilters(state: ResourcesState, types: string[]) {

        if (viewState(state).bypassHierarchy) {
            (viewState(state).searchContext as any).types = types;
        } else {
            NavigationPath.setTypeFilters(getNavigationPath(state), types);
            updateNavigationPath(state, getNavigationPath(state));
        }
    }


    export function setCustomConstraints(state: ResourcesState,
                                         constraints: { [name: string]: string}) {

        viewState(state).customConstraints = constraints;
    }


    export function setSelectedDocument(state: ResourcesState,
                                        document: FieldDocument|undefined) {

        if (viewState(state).bypassHierarchy) {
            (viewState(state).searchContext as any).selected = document;
        } else {
            NavigationPath.setSelectedDocument(getNavigationPath(state), document);
            updateNavigationPath(state, getNavigationPath(state));
        }
    }


    export function setActiveLayerIds(state: ResourcesState, activeLayersIds: string[]) {

        // const layerContextId = isAllSelection(viewState(state)) ? '_all' : mainTypeDocumentResourceId;
        viewState(state).layerIds = activeLayersIds.slice(0);
    }


    export function setMode(state: ResourcesState, mode: 'map'|'list') {

        viewState(state).mode = mode;
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
        //     activeDocumentViewTab: undefined
        // }
    }


    export function makeDefaults(): ResourcesState {

        return {
            overviewState: ViewState.default(),
            operationViewStates: {},
            view: 'project',
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

