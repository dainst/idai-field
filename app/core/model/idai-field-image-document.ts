import {Document} from 'idai-components-2';
import {IdaiFieldImageResource} from './idai-field-image-resource';

export interface IdaiFieldImageDocument extends Document {

    id?: string;
    resource: IdaiFieldImageResource;
}