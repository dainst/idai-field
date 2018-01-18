import {NavigationPath} from '../navigation-path';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';


/**
 * @author Thomas Kleinke
 */
export interface ResourcesViewState {

    mainTypeDocument?: IdaiFieldDocument;
    types?: string[];
    q?: string;
    mode?: string;
    layerIds?: {[mainTypeDocumentId: string]: string[]};
    navigationPaths?: {[mainTypeDocumentId: string]: NavigationPath};
}
