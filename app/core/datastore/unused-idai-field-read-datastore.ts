

// TODO transfer this apidoc to the corresponding places

// import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
// import {ReadDatastore, Query} from "idai-components-2/datastore";
// import {Document} from "idai-components-2/core";
//
/**
 * The interface for datastores supporting
 * the idai-field application.
 *
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
// export abstract class UnusedIdaiFieldReadDatastore<T extends Document> extends ReadDatastore {


    /* find
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
    // public abstract find(query: Query):Promise<T[]>;


    /**
     * get
     *
     * In addition to {@link Datastore#get}, {@link CachedDatastore#get}
     * has some extra specifications:
     *
     * options can be
     *   { skip_cache: true }
     */

    /**
     * @returns
     *   Rejects with
     *     [DOCUMENT_NOT_FOUND] - in case of error
     */
    // abstract getRevision(docId: string, revisionId: string): Promise<T>;
// }
