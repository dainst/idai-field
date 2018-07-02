import {IdaiFieldDocument} from 'idai-components-2/field';
import {ViewState} from './view-state';
import {ObjectUtil} from '../../../../util/object-util';
import {NavigationPath} from './navigation-path';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export interface ResourcesState { // 'the' resources state

    readonly viewStates: { [viewName: string]: ViewState };
    readonly view: string;
    readonly mode: 'map' | 'list';
    readonly activeDocumentViewTab: string|undefined;
}


export module ResourcesState {


    export function getQueryString(state: ResourcesState) {

        return NavigationPath.getQueryString(getNavigationPath(state), getDisplayHierarchy(state));
    }


    export function getTypeFilters(state: ResourcesState) {

        return NavigationPath.getTypeFilters(getNavigationPath(state), getDisplayHierarchy(state));
    }


    export function getSelectedDocument(state: ResourcesState) {

        return NavigationPath.getSelectedDocument(getNavigationPath(state), getDisplayHierarchy(state));
    }


    export function getNavigationPath(state: ResourcesState): NavigationPath {

        const viewState: ViewState = state.viewStates[state.view];

        if (isAllSelection(viewState)) return viewState.navigationPaths['_all'];

        const mainTypeDocumentResourceId = viewState.mainTypeDocumentResourceId;
        if (!mainTypeDocumentResourceId) return NavigationPath.empty();

        const path = viewState.navigationPaths[mainTypeDocumentResourceId];
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


    export function setActiveDocumentViewTab(state: ResourcesState, activeDocumentViewTab: string|undefined): ResourcesState {

        const cloned: any = ObjectUtil.cloneObject(state);
        cloned.activeDocumentViewTab = activeDocumentViewTab;
        return cloned;
    }


    export function setView(state: ResourcesState, view: string): ResourcesState {

        const cloned: any = ObjectUtil.cloneObject(state);
        cloned.view = view;
        return cloned;
    }


    export function setMode(state: ResourcesState, mode: 'map' | 'list'): ResourcesState {

        const cloned: any = ObjectUtil.cloneObject(state);
        cloned.mode = mode;
        return cloned;
    }


    export function setQueryString(state: ResourcesState, q: string): ResourcesState {

        return updateNavigationPath(state, NavigationPath.setQueryString(getNavigationPath(state),
            getDisplayHierarchy(state), q));
    }


    export function setTypeFilters(state: ResourcesState, types: string[]): ResourcesState {

        return updateNavigationPath(state, NavigationPath.setTypeFilters(getNavigationPath(state),
            getDisplayHierarchy(state), types));
    }


    export function setSelectedDocument(state: ResourcesState, document: IdaiFieldDocument|undefined): ResourcesState {

        return updateNavigationPath(state, NavigationPath.setSelectedDocument(getNavigationPath(state),
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

        const mainTypeDocumentResourceId: string|undefined = getMainTypeDocumentResourceId(cloned);
        if (!mainTypeDocumentResourceId) return cloned;

        const viewState: ViewState = cloned.viewStates[cloned.view];
        const navigationPathId: string = isAllSelection(viewState) ? '_all' : mainTypeDocumentResourceId;
        viewState.navigationPaths[navigationPathId] = navPath;

        return cloned;
    }


    export function makeSampleDefaults(): ResourcesState {

        return {
            viewStates: {
                project: {
                    layerIds: {'test': ['o25']},
                    displayHierarchy: true,
                    bypassOperationTypeSelection: false,
                    navigationPaths: {
                        '_all': NavigationPath.empty()
                    }
                },
                excavation: {
                    displayHierarchy: true,
                    bypassOperationTypeSelection: false,
                    navigationPaths: {
                        't1': NavigationPath.empty(),
                        '_all': NavigationPath.empty()
                    },
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

        const cloned = ObjectUtil.cloneObject(state);
        Object.keys(cloned.viewStates)
            .forEach(viewName => ViewState.complete(cloned.viewStates[viewName]));
        return cloned;
    }


    export function setDisplayHierarchy(state: ResourcesState, displayHierarchy: boolean): ResourcesState {

        const cloned = ObjectUtil.cloneObject(state);
        (cloned.viewStates[cloned.view] as any).displayHierarchy = displayHierarchy;
        return cloned;
    }


    export function setMainTypeDocumentResourceId(state: ResourcesState,
                                                  mainTypeDocumentResourceId: string|undefined): ResourcesState {

        const cloned = ObjectUtil.cloneObject(state);
        (cloned.viewStates[cloned.view] as any).mainTypeDocumentResourceId = mainTypeDocumentResourceId;
        return cloned;
    }

    export function setBypassOperationTypeSelection(state: ResourcesState, bypassOperationTypeSelection: boolean): ResourcesState {

        const cloned = ObjectUtil.cloneObject(state);
        (cloned.viewStates[cloned.view] as any).bypassOperationTypeSelection = bypassOperationTypeSelection;
        return cloned;
    }


    function isAllSelection(viewState: ViewState): boolean {

        return !viewState.displayHierarchy && viewState.bypassOperationTypeSelection;
    }
}

