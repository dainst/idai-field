import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Datastore} from "idai-components-2/datastore";
import {SyncState} from "./sync-state";

/**
 * The interface for datastores supporting
 * the idai-field document model.
 *
 * The find method accepts the following constraints:
 *   resource.relations.isRecordedIn
 *   resource.relations.liesWithin
 *   resource.identifier
 *
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export abstract class IdaiFieldDatastore extends Datastore {

    abstract findConflicted(): Promise<IdaiFieldDocument[]>;

    /**
     * Setup peer-to-peer syncing between this datastore and target.
     * Changes to sync state will be published via the onSync*-Methods.
     * @param url target datastore
     */
    abstract setupSync(url: string): Promise<SyncState>;

    abstract stopSync();

    abstract getLatestRevision(id: string): Promise<IdaiFieldDocument>;

    abstract getRevision(docId: string, revisionId: string): Promise<IdaiFieldDocument>;

    abstract getRevisionHistory(docId: string): Promise<Array<PouchDB.Core.RevisionInfo>>;

    abstract removeRevision(docId: string, revisionId: string): Promise<any>;
}
