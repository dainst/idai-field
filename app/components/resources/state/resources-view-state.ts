import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {NavigationPathInternal} from './navigation-path-internal';


/**
 * @author Thomas Kleinke
 */
export interface ResourcesViewState {

    mainTypeDocument?: IdaiFieldDocument;
    types?: string[]; // query types in overview
    q: string; // query string in overview
    mode: string;
    layerIds: {[mainTypeDocumentId: string]: string[]};
    navigationPaths: {[mainTypeDocumentId: string]: NavigationPathInternal};
}


export class ResourcesViewState {

    public static default = () => { return {
        q: '',
        mode: 'map',
        navigationPaths: {},
        layerIds: {}
    }; }


    public static complete(viewStates: { [viewName: string]: ResourcesViewState }) {

        Object.keys(viewStates)
            .forEach(viewState => {
                if (!viewStates[viewState].navigationPaths) viewStates[viewState].navigationPaths = {};
                if (!viewStates[viewState].layerIds) viewStates[viewState].layerIds = {};
                if (!viewStates[viewState].q) viewStates[viewState].q = '';
                if (!viewStates[viewState].mode) viewStates[viewState].mode = 'map';
            });

        return viewStates
    }
}