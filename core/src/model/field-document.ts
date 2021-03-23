import {Document} from 'idai-components-2';
import {FieldResource} from './field-resource';


export interface FieldDocument extends Document {

    resource: FieldResource;
    id?: string;
}
