import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';


/**
 * @author Thomas Kleinke
 */
export interface Map3DControlState {

    dragging: boolean;
    hoverDocument?: IdaiFieldDocument;
    selectedDocument?: IdaiFieldDocument;
}