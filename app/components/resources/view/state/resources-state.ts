import {IdaiFieldDocument} from 'idai-components-2/field';
import {ViewState} from './view-state';
import {ObjectUtil} from '../../../../util/object-util';
import {NavigationPath} from './navigation-path';
import {ViewContext} from './view-context';

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

        return viewState(state).bypassHierarchy
            ? viewState(state).searchContext.q
            : NavigationPath.getQueryString(getNavigationPath(state), getBypassHierarchy(state));
    }


    export function getTypeFilters(state: ResourcesState) {

        return viewState(state).bypassHierarchy
            ? viewState(state).searchContext.types
            : NavigationPath.getTypeFilters(getNavigationPath(state), getBypassHierarchy(state));
    }


    export function getCustomConstraints(state: ResourcesState) {

        return viewState(state).bypassHierarchy
            ? viewState(state).customConstraints
            : {};
    }


    export function getSelectedDocument(state: ResourcesState): IdaiFieldDocument|undefined {

        return viewState(state).bypassHierarchy
            ? viewState(state).searchContext.selected
            : NavigationPath.getSelectedDocument(getNavigationPath(state), getBypassHierarchy(state));
    }


    export function getNavigationPath(state: ResourcesState): NavigationPath {

        const mainTypeDocumentResourceId = viewState(state).mainTypeDocumentResourceId;
        if (!mainTypeDocumentResourceId) return NavigationPath.empty();

        const path = viewState(state).navigationPaths[mainTypeDocumentResourceId];
        return path ? path : NavigationPath.empty();
    }


    export function getSelectAllOperationsOnBypassHierarchy(state: ResourcesState): boolean {

        return viewState(state).selectAllOperationsOnBypassHierarchy;
    }


    export function getBypassHierarchy(state: ResourcesState): boolean {

        return viewState(state).bypassHierarchy;
    }


    export function getMainTypeDocumentResourceId(state: ResourcesState): string|undefined {

        return viewState(state).mainTypeDocumentResourceId;
    }


    export function getActiveLayersIds(state: ResourcesState): string[] {

        const mainTypeDocumentResourceId = getMainTypeDocumentResourceId(state);
        if (!mainTypeDocumentResourceId) return [];

        const layersIds = viewState(state).layerIds[isAllSelection(viewState(state)) ? '_all' : mainTypeDocumentResourceId];
        return layersIds ? layersIds : [];
    }


    export function getLayerIds(state: ResourcesState): {[mainTypeDocumentId: string]: string[]} {

        return viewState(state).layerIds;
    }


    export function setActiveDocumentViewTab(state: ResourcesState, activeDocumentViewTab: string|undefined): ResourcesState {

        const cloned: any = ObjectUtil.cloneWithDates(state);
        cloned.activeDocumentViewTab = activeDocumentViewTab;
        return cloned;
    }


    export function setView(state: ResourcesState, view: string): ResourcesState {

        const cloned: any = ObjectUtil.cloneWithDates(state);
        cloned.view = view;
        return cloned;
    }


    export function setMode(state: ResourcesState, mode: 'map' | 'list'): ResourcesState {

        const cloned: any = ObjectUtil.cloneWithDates(state);
        cloned.mode = mode;
        return cloned;
    }


    export function setQueryString(state: ResourcesState, q: string): ResourcesState {

        if (viewState(state).bypassHierarchy) {

            const cloned: any = ObjectUtil.cloneWithDates(state);
            (viewState(cloned).searchContext as any /* cast ok on construct*/).q = q;
            return cloned;

        } else {

            return updateNavigationPath(state, NavigationPath.setQueryString(getNavigationPath(state),
                getBypassHierarchy(state), q));
        }
    }


    export function setTypeFilters(state: ResourcesState, types: string[]): ResourcesState {

        if (viewState(state).bypassHierarchy) {

            const cloned: any = ObjectUtil.cloneWithDates(state);
            (viewState(cloned).searchContext as any /* cast ok on construct*/).types = types;
            return cloned;

        } else {

            return updateNavigationPath(state, NavigationPath.setTypeFilters(getNavigationPath(state),
                getBypassHierarchy(state), types));
        }
    }


    export function setCustomConstraints(state: ResourcesState,
                                         constraints: { [name: string]: string}): ResourcesState {

        const cloned: any = ObjectUtil.cloneWithDates(state);
        (viewState(cloned) as any /* cast ok on construct*/).customConstraints = constraints;
        return cloned;
    }


    export function setSelectedDocument(state: ResourcesState,
                                        document: IdaiFieldDocument|undefined): ResourcesState {

        if (viewState(state).bypassHierarchy) {

            const cloned: any = ObjectUtil.cloneWithDates(state);
            (viewState(cloned).searchContext as any /* cast ok on construct*/).selected = document;
            return cloned;

        } else {

            return updateNavigationPath(state, NavigationPath.setSelectedDocument(getNavigationPath(state),
                viewState(state).bypassHierarchy, document));
        }
    }


    export function setActiveLayerIds(state: ResourcesState, activeLayersIds: string[]): ResourcesState {

        const cloned = ObjectUtil.cloneWithDates(state);

        const mainTypeDocumentResourceId = getMainTypeDocumentResourceId(cloned);
        if (!mainTypeDocumentResourceId) return cloned;

        const layerContextId = isAllSelection(viewState(cloned)) ? '_all' : mainTypeDocumentResourceId;
        viewState(cloned).layerIds[layerContextId] = activeLayersIds.slice(0);

        return cloned;
    }


    export function removeActiveLayersIds(state: ResourcesState): ResourcesState {

        const cloned = ObjectUtil.cloneWithDates(state);

        const mainTypeDocumentResourceId = getMainTypeDocumentResourceId(cloned);
        if (mainTypeDocumentResourceId) delete viewState(cloned).layerIds[mainTypeDocumentResourceId];

        return cloned;
    }


    export function updateNavigationPath(state: ResourcesState, navPath: NavigationPath): ResourcesState {

        const cloned = ObjectUtil.cloneWithDates(state);

        const mainTypeDocumentResourceId: string|undefined = getMainTypeDocumentResourceId(cloned);
        if (!mainTypeDocumentResourceId) return cloned;

        viewState(cloned).navigationPaths[mainTypeDocumentResourceId] = navPath;

        return cloned;
    }


    export function makeSampleDefaults(): ResourcesState {

        return {
            viewStates: {
                project: {
                    layerIds: {'project': ['o25']},
                    bypassHierarchy: false,
                    selectAllOperationsOnBypassHierarchy: false,
                    navigationPaths: {},
                    searchContext: ViewContext.empty(),
                    customConstraints: {}
                },
                excavation: {
                    bypassHierarchy: false,
                    selectAllOperationsOnBypassHierarchy: false,
                    navigationPaths: {
                        't1': NavigationPath.empty()
                    },
                    layerIds: {'t1': ['o25']},
                    searchContext: ViewContext.empty(),
                    customConstraints: {}
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

        const cloned = ObjectUtil.cloneWithDates(state);
        Object.keys(cloned.viewStates)
            .forEach(viewName => ViewState.complete(cloned.viewStates[viewName]));
        return cloned;
    }


    export function setBypassHierarchy(state: ResourcesState, bypassHierarchy: boolean): ResourcesState {

        const cloned = ObjectUtil.cloneWithDates(state);
        (viewState(cloned) as any /* write ok on construction */).bypassHierarchy = bypassHierarchy;
        return cloned;
    }


    export function setMainTypeDocumentResourceId(state: ResourcesState,
                                                  mainTypeDocumentResourceId: string|undefined): ResourcesState {

        const cloned = ObjectUtil.cloneWithDates(state);
        (viewState(cloned) as any /* write ok on construction */).mainTypeDocumentResourceId = mainTypeDocumentResourceId;
        (viewState(cloned) as any /* write ok on construction */).searchContext.selected = undefined; // TODO test this
        return cloned;
    }

    export function setSelectAllOperationsOnBypassHierarchy(state: ResourcesState, selectAllOperationsOnBypassHierarchy: boolean): ResourcesState {

        const cloned = ObjectUtil.cloneWithDates(state);
        (viewState(cloned) as any /* write ok on construction */).selectAllOperationsOnBypassHierarchy = selectAllOperationsOnBypassHierarchy;
        if (selectAllOperationsOnBypassHierarchy) {
            (viewState(state) as any /* write ok on construction */).searchContext.selected = undefined; // TODO test this
        }
        return cloned;
    }


    function isAllSelection(viewState: ViewState): boolean {

        return viewState.bypassHierarchy && viewState.selectAllOperationsOnBypassHierarchy;
    }


    function viewState(state: ResourcesState): ViewState {

        return state.viewStates[state.view];
    }
}

