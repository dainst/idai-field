import {FieldDocument} from 'idai-components-2';
import {NavigationPath} from './navigation-path';
import {ViewContext} from './view-context';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export interface ViewState {

    // readonly mainTypeDocumentResourceId?: string;

    operation: FieldDocument|undefined;
    layerIds: string[];
    navigationPath: NavigationPath;

    // bypassHierarchy (search mode) related
    readonly bypassHierarchy: boolean;
    readonly searchContext: ViewContext;
    readonly customConstraints: { [name: string]: string }

    // readonly selectAllOperationsOnBypassHierarchy: boolean;
}


export class ViewState {

    public static default(operation: FieldDocument|undefined): ViewState {

        return {
            operation: operation,
            bypassHierarchy: false,
            // selectAllOperationsOnBypassHierarchy: false,
            navigationPath: NavigationPath.empty(),
            layerIds: [],
            searchContext: ViewContext.empty(),
            customConstraints: {}
        };
    };


    public static complete(viewState: ViewState) {

        if (!viewState.layerIds || Array.isArray(viewState.layerIds)) {
            (viewState as any).layerIds = {};
        } else {
            for (let key of Object.keys(viewState.layerIds)) {
                if (!Array.isArray(viewState.layerIds[key])) {
                    delete viewState.layerIds[key];
                }
            }
        }

        (viewState as any).bypassHierarchy = false;
        (viewState as any).searchContext = ViewContext.empty();
        (viewState as any).navigationPaths = {};
        (viewState as any).customConstraints = {};
    }
}