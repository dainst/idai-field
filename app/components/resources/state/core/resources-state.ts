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


    export function updateNavigationPath(state: ResourcesState, navPath: NavigationPath): ResourcesState {

        const clone = ObjectUtil.cloneObject(state);

        const mainTypeDocumentResourceId = clone.viewStates[clone.view].mainTypeDocumentResourceId;
        if (!mainTypeDocumentResourceId) return clone;

        clone.viewStates[clone.view].navigationPaths[mainTypeDocumentResourceId] = navPath;
        return clone;
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


    export function complete(state: ResourcesState ) {

        Object.keys(state.viewStates)
            .forEach(viewName => ViewState.complete(state.viewStates[viewName]));
    }


    export function createObjectToSerialize(state: ResourcesState) : { [viewName: string]: ViewState } {

        const objectToSerialize: { [viewName: string]: ViewState } = {};

        for (let viewName of Object.keys(state.viewStates)) {
            objectToSerialize[viewName] = {} as any;
            if (this._.viewStates[viewName].layerIds) {
                objectToSerialize[viewName].layerIds = this._.viewStates[viewName].layerIds;
            }
        }

        return objectToSerialize;
    }
}

