import {Document} from 'idai-components-2/core';
import {IdaiField3DResource} from './idai-field-3d-resource';


/**
 * @author Thomas Kleinke
 */
export interface IdaiField3DDocument extends Document {

    id?: string;
    resource: IdaiField3DResource;
}