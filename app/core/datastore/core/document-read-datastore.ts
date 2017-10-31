import {Document} from 'idai-components-2/core';
import {PouchdbDatastore} from "./pouchdb-datastore";
import {DocumentCache} from "./document-cache";
import {ImageTypeUtility} from "../../../common/image-type-utility";
import {CachedReadDatastore} from "./cached-read-datastore";

/**
 * @author Daniel de Oliveira
 */
export abstract class DocumentReadDatastore extends CachedReadDatastore<Document> {}