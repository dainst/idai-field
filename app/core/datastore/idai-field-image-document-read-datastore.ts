import {PouchdbDatastore} from "./core/pouchdb-datastore";
import {DocumentCache} from "./core/document-cache";
import {ImageTypeUtility} from "../../common/image-type-utility";
import {IdaiFieldImageDocument} from "../model/idai-field-image-document";
import {CachedReadDatastore} from "./core/cached-read-datastore";
import {Document} from 'idai-components-2/core';

/**
 * @author Daniel de Oliveira
 */
export abstract class IdaiFieldImageDocumentReadDatastore extends CachedReadDatastore<IdaiFieldImageDocument> {}