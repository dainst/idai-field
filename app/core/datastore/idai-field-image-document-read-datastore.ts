import {IdaiFieldImageDocument} from '../model/idai-field-image-document';
import {CachedReadDatastore} from './core/cached-read-datastore';

/**
 * @author Daniel de Oliveira
 */
export abstract class IdaiFieldImageDocumentReadDatastore
    extends CachedReadDatastore<IdaiFieldImageDocument> {}