import {Document} from 'idai-field-core';
import {CachedReadDatastore} from './cached/cached-read-datastore';

/**
 * @author Daniel de Oliveira
 * @author Thomas Klienke
 */
export abstract class DocumentReadDatastore extends CachedReadDatastore<Document> {}
