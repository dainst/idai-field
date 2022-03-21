import { FeatureResource } from './feature-resource';
import { FieldDocument } from './field-document';


/**
 * @author Daniel de Oliveira
 */
export interface FeatureDocument extends FieldDocument {

    resource: FeatureResource;
}
