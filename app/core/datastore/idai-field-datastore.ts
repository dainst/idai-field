import {Document} from 'idai-components-2/core';
import {CachedDatastore} from "./core/cached-datastore";
import {IdaiFieldReadDatastore} from "./idai-field-read-datastore";

/**
 * @author Daniel de Oliveira
 */
export abstract class IdaiFieldDatastore
    extends CachedDatastore<Document>
    implements IdaiFieldReadDatastore {}