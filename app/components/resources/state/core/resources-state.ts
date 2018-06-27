import {ViewState} from './view-state';
import {NavigationPath} from '../navpath/navigation-path';

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
}

