import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';


/**
 * @author Thomas Kleinke
 */
export interface NavigationPath {

    elements: Array<IdaiFieldDocument>;
    rootDocument?: IdaiFieldDocument;
}