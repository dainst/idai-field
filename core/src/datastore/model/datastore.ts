import {Document} from '../../model/document';
import { Query } from '../../model/query';


/**
 * TODO merge apidocs
 * 
 * The interface providing read access methods
 * for datastores supporting the idai-field-core document model.
 * For full access see <code>Datastore</code>
 *
 * Implementations guarantee that any of the methods declared here
 * have no effect on any of the documents within the datastore.
 *
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
/**
 * The interface for datastores supporting
 * the idai-components document model.
 *
 * The errors with which the methods reject, like GENERIC_SAVE_ERROR,
 * are constants of {@link DatastoreErrors}, so GENERIC_SAVE_ERROR really
 * is DatastoreErrors.GENERIC_SAVE_ERROR. The brackets [] are array indicators,
 * so [GENERIC_SAVE_ERROR] is an array containing one element, which is the string
 * corresponding to GENERIC_SAVE_ERROR.
 *
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export abstract class Datastore {

    /**
     * Persists a given document. If document.resource.id is not set,
     * it will be set to a generated value. In case of an error it remains undefined.
     *
     * In case of a successful call, document.modified and document.created get set,
     * otherwise they remain undefined.
     *
     * @param doc
     * @param username
     * @returns {Promise<Document>} a document
     * @throws [GENERIC_ERROR (, cause: any)] - in case of error, optionally including a cause
     * @throws [DOCUMENT_RESOURCE_ID_EXISTS] - if a document with doc.resource.id already exists
     * @throws [INVALID_DOCUMENT] - in case doc is not valid
     */
    abstract create(doc: Document, username: string): Promise<Document>;

    /**
     * Updates an existing document
     *
     * @param doc
     * @param username
     * @param squashRevisionsIds
     * @returns {Promise<Document>} a document
     * @throws [GENERIC_ERROR (, cause: any)] - in case of error, optionally including a cause
     * @throws [SAVE_CONFLICT] - in case of conflict
     * @throws [DOCUMENT_NO_RESOURCE_ID] - if doc has no resource id
     * @throws [INVALID_DOCUMENT] - in case doc is not valid
     * @throws [DOCUMENT_NOT_FOUND] - if document has a resource id, but does not exist in the db
     */
    abstract update(doc: Document, username: string, squashRevisionsIds?: string[]): Promise<Document>;

    /**
     * Removes an existing document
     *
     * @param doc
     * @returns {Promise<undefined>} undefined
     * @throws [DOCUMENT_NO_RESOURCE_ID] - if document has no resource id
     * @throws [DOCUMENT_NOT_FOUND] - if document has a resource id, but does not exist in the db
     * @throws [GENERIC_ERROR (, cause: any)] - in case of error, optionally including a cause
     */
    abstract remove(doc: Document): Promise<undefined>;


    /**
     * @param resourceId the desired document's resource id
     * @param options to control implementation specific behaviour
     * @returns {Promise<Document>} a document (rejects with msgWithParams in case of error)
     * @throws [DOCUMENT_NOT_FOUND] - in case document is missing
     * @throws [INVALID_DOCUMENT] - in case document is not valid
     */
     abstract get(resourceId: string, options?: Object): Promise<Document>;


     /**
      * @param resourceIds the resource ids of the documents to find
      * @returns {Promise<Array<Document>>} list of found documents
      */
     abstract getMultiple(resourceIds: string[]): Promise<Array<Document>>;
 
 
     /**
      * Perform a fulltext query
 
      * @param query the query object
      * @returns {Promise<Document[]>} an array of documents
      * @throws [GENERIC_ERROR (, cause: any)] - in case of error, optionally including a cause
      */
     abstract find(query: Query): Promise<FindResult>;
 
 
     abstract findIds(query: Query): FindIdsResult;
}


export interface FindIdsResult {

    ids: string[];
    totalCount: number;
    queryId?: string;
}


export interface FindResult extends FindIdsResult {

    documents: Array<Document>;
}


export module FindResult {

    export const DOCUMENTS = 'documents';
    export const TOTALCOUNT = 'totalCount';
}