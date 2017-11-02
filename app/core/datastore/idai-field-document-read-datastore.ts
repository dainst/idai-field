import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {CachedReadDatastore} from './core/cached-read-datastore';

/**
 * @author Daniel de Oliveira
 */
export abstract class IdaiFieldDocumentReadDatastore
    extends CachedReadDatastore<IdaiFieldDocument> {}