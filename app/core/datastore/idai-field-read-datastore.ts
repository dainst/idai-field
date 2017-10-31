import {Document} from 'idai-components-2/core';
import {CachedReadDatastore} from "./core/cached-read-datastore";

/**
 * @author Daniel de Oliveira
 */
export abstract class IdaiFieldReadDatastore extends CachedReadDatastore<Document> {

    /* find(query: Query):Promise<T[]>;
     *
     * In addition to {@link Datastore#find}, {@link IdaiFieldReadDatastore#find}
     * has some extra specifications:
     *
     * The find method accepts the following constraints:
     *   resource.relations.isRecordedIn
     *   resource.relations.liesWithin
     *   resource.identifier
     *
     * Also, find returns the documents in order.
     * It sorts the objects by lastModified (as per the modified array) descending.
     * If two documents have the exact same lastModified, there is no second sort criterium
     * so the order between them is unspecified.
     */
}