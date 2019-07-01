import {FieldDocument} from 'idai-components-2';


export type Map3DAction = 'drag'|'changeAngle'|'none';


/**
 * @author Thomas Kleinke
 */
export interface Map3DControlState {

    action: Map3DAction;
    hoverDocument?: FieldDocument;
    selectedDocument?: FieldDocument;
}