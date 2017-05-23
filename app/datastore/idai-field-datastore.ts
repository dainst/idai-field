import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Datastore} from "idai-components-2/datastore";
import {SyncState} from "./sync-state";

/**
 * The interface for datastores supporting
 * the idai-field document model.
 *
 * @author Sebastian Cuy
 */
export abstract class IdaiFieldDatastore extends Datastore {

    /**
     * @param identifier
     * @returns {Promise<Document|string>} the document with the given identifier
     */
    abstract findByIdentifier(identifier: string): Promise<IdaiFieldDocument>;


    abstract findUnsynced(): Promise<IdaiFieldDocument[]>;

    abstract findByBelongsTo(identifier: string): Promise<IdaiFieldDocument[]>;

    /**
     * Setup peer-to-peer syncing between this datastore and target.
     * Changes to sync state will be published via the onSync*-Methods.
     * @param url target datastore
     */
    abstract setupSync(url: string): Promise<SyncState>;

    abstract stopSync();

    abstract getLatestRevision(id: string): Promise<IdaiFieldDocument>;

    abstract getRevision(docId: string, revisionId: string): Promise<IdaiFieldDocument>;

    abstract removeRevision(docId: string, revisionId: string): Promise<any>;

    abstract select(name: string): any;

    abstract findConflicted(): Promise<IdaiFieldDocument[]>;
}
