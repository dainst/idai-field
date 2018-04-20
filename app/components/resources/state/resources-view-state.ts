import {IdaiFieldDocument} from 'idai-components-2/field';
import {NavigationPathInternal} from './navigation-path-internal';


/**
 * @author Thomas Kleinke
 */
export interface ResourcesViewState {

    mainTypeDocument?: IdaiFieldDocument;
    types?: string[]; // query types in overview // TODO remove
    q: string; // query string in overview       // TODO remove
    layerIds: {[mainTypeDocumentId: string]: string[]};
    navigationPaths: {[mainTypeDocumentId: string]: NavigationPathInternal};
}


export class ResourcesViewState {

    public static default() {

        return {
            q: '',
            mode: 'map',
            navigationPaths: {},
            layerIds: {}
        };
    };


    public static complete(viewState: ResourcesViewState) {

        if (!viewState.layerIds || Array.isArray(viewState.layerIds)) {
            viewState.layerIds = {};
        } else {
            for (let key of Object.keys(viewState.layerIds)) {
                if (!Array.isArray(viewState.layerIds[key])) {
                    delete viewState.layerIds[key];
                }
            }
        }

        viewState.navigationPaths = {};
        viewState.q = '';
    }
}