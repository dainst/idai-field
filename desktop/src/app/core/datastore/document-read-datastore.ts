import {Document} from 'idai-field-core';
import { CachedDatastore } from './cached/cached-datastore';

/**
 * @author Daniel de Oliveira
 * @author Thomas Klienke
 */
export abstract class DocumentReadDatastore extends CachedDatastore<Document> {}
