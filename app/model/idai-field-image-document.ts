import {Document} from 'idai-components-2/core';
import {IdaiFieldImageResource} from './idai-field-image-resource';

export interface IdaiFieldImageDocument extends Document {
    synced: number;
    resource: IdaiFieldImageResource;
    id?: string;
}