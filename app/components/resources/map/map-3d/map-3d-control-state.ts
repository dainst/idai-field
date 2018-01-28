import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';


/**
 * @author Thomas Kleinke
 */
export interface Map3DControlState {

    action: string; // drag, rotate, none
    hoverDocument?: IdaiFieldDocument;
    selectedDocument?: IdaiFieldDocument;
}