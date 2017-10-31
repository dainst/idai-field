import {CachedDatastore} from "./core/cached-datastore";
import {Document} from 'idai-components-2/core';
import {PouchdbDatastore} from "./core/pouchdb-datastore";
import {DocumentCache} from "./core/document-cache";
import {ImageTypeUtility} from "../../common/image-type-utility";
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {CachedReadDatastore} from "./core/cached-read-datastore";

/**
 * @author Daniel de Oliveira
 */
export abstract class IdaiFieldDocumentReadDatastore extends CachedReadDatastore<IdaiFieldDocument> {}