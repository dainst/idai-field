import {Injectable} from '@angular/core';
import { SyncStatus } from '../datastore/pouchdb/sync-process';


@Injectable()
/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class SynchronizationStatus {

    private status: SyncStatus = SyncStatus.Offline;

    public getStatus = (): SyncStatus => this.status;

    public setStatus = (status: SyncStatus) => {
        this.status = status;
    }
}