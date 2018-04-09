import {IdaiFieldDocument} from 'idai-components-2/field';
import {IdaiFieldFeatureResource} from './idai-field-feature-resource';

/**
 * @author Daniel de Oliveira
 */
export interface IdaiFieldFeatureDocument extends IdaiFieldDocument {

    resource: IdaiFieldFeatureResource;
}