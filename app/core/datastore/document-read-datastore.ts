import {Document} from 'idai-components-2';
import {CachedReadDatastore} from './core/cached-read-datastore';

/**
 * @author Daniel de Oliveira
 * @author Thomas Klienke
 */
export abstract class DocumentReadDatastore extends CachedReadDatastore<Document> {}