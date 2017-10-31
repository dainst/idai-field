import {IdaiFieldImageDocument} from "../model/idai-field-image-document";
import {IdaiFieldReadDatastore} from "./idai-field-read-datastore";
import {CachedReadDatastore} from "./core/cached-read-datastore";

/**
 * @author Daniel de Oliveira
 */
export abstract class IdaiFieldImageDocumentReadDatastore
    extends CachedReadDatastore<IdaiFieldImageDocument>
    implements IdaiFieldReadDatastore {

}