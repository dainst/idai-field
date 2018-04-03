import {Document} from 'idai-components-2/core';
import {IdaiFieldFeatureResource} from './idai-field-feature-resource';

/**
 * @author Daniel de Oliveira
 */
export interface IdaiFieldFeatureDocument extends Document {

    id?: string;
    resource: IdaiFieldFeatureResource;
}