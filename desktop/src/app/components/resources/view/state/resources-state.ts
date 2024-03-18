import { flow, forEach, keys, lookup, map, values } from 'tsfun';
import { FieldDocument } from 'idai-field-core';
import { ViewState } from './view-state';
import { NavigationPath } from './navigation-path';
import { ViewContext } from './view-context';
import { ResourcesViewMode } from '../view-facade';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export interface ResourcesState { // 'the' resources state

    overviewState: ViewState;
    typesManagementState: ViewState;
    inventoryState: ViewState;
    operationViewStates: { [operationId: string]: ViewState };
    view: 'project' | string; // <- active view state
    activeDocumentViewTab: string|undefined;
}


export module ResourcesState {


    export function getQueryString(state: ResourcesState) {

        return getViewState(state).bypassHierarchy
            ? getViewState(state).searchContext.q
            : NavigationPath.getQueryString(getNavigationPath(state));
    }


    export function getCategoryFilters(state: ResourcesState) {

        return getViewState(state).bypassHierarchy
            ? getViewState(state).searchContext.categories
            : NavigationPath.getCategoryFilters(getNavigationPath(state));
    }


    export function getCustomConstraints(state: ResourcesState) {

        return getViewState(state).bypassHierarchy
            ? getViewState(state).customConstraints
            : {};
    }


    export function getSelectedDocument(state: ResourcesState): FieldDocument|undefined {

        return getViewState(state).bypassHierarchy
            ? getViewState(state).searchContext.selected
            : NavigationPath.getSelectedDocument(getNavigationPath(state));
    }


    export function getNavigationPath(state: ResourcesState): NavigationPath {

        const path = getViewState(state).navigationPath;
        return path ? path : NavigationPath.empty();
    }


    export function getCurrentOperation(state: ResourcesState): FieldDocument|undefined {

        return getViewState(state).operation;
    }


    export function getExpandAllGroups(state: ResourcesState) {

        return getViewState(state).expandAllGroups;
    }


    export function isInExtendedSearchMode(state: ResourcesState): boolean {

        return getViewState(state).bypassHierarchy;
    }


    export function getActiveLayersIds(state: ResourcesState): string[]|undefined {

        return getViewState(state).layerIds;
    }


    export function getMode(state: ResourcesState): ResourcesViewMode {

        return getViewState(state).mode;
    }


    export function isLimitSearchResults(state: ResourcesState): boolean {

        return getViewState(state).limitSearchResults;
    }


    export function setActiveDocumentViewTab(state: ResourcesState, activeDocumentViewTab: string|undefined) {

        state.activeDocumentViewTab = activeDocumentViewTab;
    }


    export function setQueryString(state: ResourcesState, q: string) {

        if (getViewState(state).bypassHierarchy) {
            getViewState(state).searchContext.q = q;
        } else {
            NavigationPath.setQueryString(getNavigationPath(state), q);
            updateNavigationPath(state, getNavigationPath(state));
        }
    }


    export function setCategoryFilters(state: ResourcesState, categories: string[]) {

        if (getViewState(state).bypassHierarchy) {
            getViewState(state).searchContext.categories = categories;
        } else {
            NavigationPath.setCategoryFilters(getNavigationPath(state), categories);
            updateNavigationPath(state, getNavigationPath(state));
        }
    }


    export function setCustomConstraints(state: ResourcesState,
                                         constraints: { [name: string]: string}) {

        getViewState(state).customConstraints = constraints;
    }


    export function setSelectedDocument(state: ResourcesState,
                                        document: FieldDocument|undefined) {

        if (getViewState(state).bypassHierarchy) {
            getViewState(state).searchContext.selected = document;
        } else {
            NavigationPath.setSelectedDocument(getNavigationPath(state), document);
            updateNavigationPath(state, getNavigationPath(state));
        }
    }


    export function setActiveLayerIds(state: ResourcesState, activeLayersIds: string[]) {

        getViewState(state).layerIds = activeLayersIds.slice(0);
    }


    export function setMode(state: ResourcesState, mode: ResourcesViewMode) {

        getViewState(state).mode = mode;
    }


    export function setLimitSearchResults(state: ResourcesState, limitSearchResults: boolean) {

        getViewState(state).limitSearchResults = limitSearchResults;
    }


    export function updateNavigationPath(state: ResourcesState, navPath: NavigationPath) {

        getViewState(state).navigationPath = navPath;
    }


    export function makeSampleDefaults(): ResourcesState {

        return {
            overviewState: {
                operation: undefined,
                mode: 'map',
                bypassHierarchy: false,
                expandAllGroups: false,
                limitSearchResults: true,
                navigationPath: NavigationPath.empty(),
                searchContext: ViewContext.empty(),
                customConstraints: {}
            },
            typesManagementState: {
                operation: undefined,
                mode: 'grid',
                bypassHierarchy: false,
                expandAllGroups: false,
                limitSearchResults: true,
                navigationPath: NavigationPath.empty(),
                searchContext: ViewContext.empty(),
                customConstraints: {}
            },
            inventoryState: {
                operation: undefined,
                mode: 'grid',
                bypassHierarchy: false,
                expandAllGroups: false,
                limitSearchResults: true,
                navigationPath: NavigationPath.empty(),
                searchContext: ViewContext.empty(),
                customConstraints: {}
            },
            operationViewStates: {
                't1': {
                    operation: undefined,
                    mode: 'map',
                    bypassHierarchy: false,
                    expandAllGroups: false,
                    limitSearchResults: true,
                    navigationPath: NavigationPath.empty(),
                    searchContext: ViewContext.empty(),
                    customConstraints: {}
                }
            },
            view: 'project',
            activeDocumentViewTab: undefined
        }
    }


    export function makeDefaults(): ResourcesState {

        return {
            overviewState: ViewState.build(),
            typesManagementState: ViewState.build('grid'),
            inventoryState: ViewState.build('grid'),
            operationViewStates: {},
            view: 'project',
            activeDocumentViewTab: undefined
        };
    }


    export function complete(state: ResourcesState): ResourcesState {

        ViewState.complete(state.overviewState);

        flow(state.operationViewStates,
            keys,
            map(lookup(state.operationViewStates)),
            values,
            forEach(ViewState.complete));

        return state;
    }


    export function setExtendedSearchMode(state: ResourcesState, extendedSearchMode: boolean) {

        getViewState(state).bypassHierarchy = extendedSearchMode;
    }


    export function setExpandAllGroups(state: ResourcesState, expandAllGroups: boolean) {

        getViewState(state).expandAllGroups = expandAllGroups;
    }


    export function deactivate(state: ResourcesState, viewName: string) {

        const deactivatedState: ViewState = ViewState.build();
        deactivatedState.operation = state.operationViewStates[viewName].operation;
        deactivatedState.layerIds = state.operationViewStates[viewName].layerIds;

        state.operationViewStates[viewName] = deactivatedState;
    }


    function getViewState(state: ResourcesState): ViewState {

        switch(state.view) {
            case 'project':
                return state.overviewState;
            case 'types':
                return state.typesManagementState;
            case 'inventory':
                return state.inventoryState;
            default:
                return state.operationViewStates[state.view];
        }
    }
}
