import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Datastore, Query} from 'idai-components-2/datastore';

/**
 * The interface for datastores supporting
 * the idai-field application.
 *
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export abstract class IdaiFieldDatastore extends Datastore {


    abstract find(query: Query):Promise<IdaiFieldDocument[]>;


    abstract getRevision(docId: string, revisionId: string): Promise<IdaiFieldDocument>;


    /**
     * @param resourceId
     * @param revisionId
     * @returns
     *   Rejects with
     *     [GENERIC_ERROR (, cause: any)] - in case of error, optionally including a cause
     */
    abstract removeRevision(resourceId: string, revisionId: string): Promise<any>;
}
