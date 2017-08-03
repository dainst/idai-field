import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Datastore} from "idai-components-2/datastore";
import {SyncState} from "./sync-state";

/**
 * The interface for datastores supporting
 * the idai-field application.
 *
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export abstract class IdaiFieldDatastore extends Datastore {

    /* find
     *
     * In addition to {@link Datastore#find}, {@link IdaiFieldDatastore#find}
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

    abstract findConflicted(): Promise<IdaiFieldDocument[]>;



    abstract getLatestRevision(id: string): Promise<IdaiFieldDocument>;

    abstract getRevision(docId: string, revisionId: string): Promise<IdaiFieldDocument>;

    abstract getRevisionHistory(docId: string): Promise<Array<PouchDB.Core.RevisionInfo>>;

    abstract removeRevision(docId: string, revisionId: string): Promise<any>;
}
