import {Injectable} from '@angular/core';
import { SyncStatus } from '../datastore/pouchdb/sync-process';
import { PouchdbManager } from '../datastore/pouchdb/pouchdb-manager';


@Injectable()
/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class SynchronizationService {

    private status: SyncStatus = SyncStatus.Offline;
    private syncTarget: string;
    private project: string;
    private currentSyncTimeout: any;


    public constructor(private pouchdbManager: PouchdbManager) {
        
    }


    public getStatus = (): SyncStatus => this.status;


    public setStatus = (status: SyncStatus) => this.status = status;


    public setSyncTarget = (syncTarget: string) => this.syncTarget = syncTarget;

    
    public setProject = (project: string) => this.project = project;


    public async startSync() {

        if (!this.syncTarget || !this.project) return;

        if (this.currentSyncTimeout) clearTimeout(this.currentSyncTimeout);

        const syncProcess = await this.pouchdbManager.setupSync(this.syncTarget, this.project);
        syncProcess.observe.subscribe(
            status => this.setStatus(status),
            err => {
                this.setStatus(err);
                syncProcess.cancel();
                this.currentSyncTimeout = setTimeout(() => this.startSync(), 5000); // retry
            }
        );
    }


    public stopSync() {

        if (this.currentSyncTimeout) clearTimeout(this.currentSyncTimeout);
        this.pouchdbManager.stopSync();
        this.setStatus(SyncStatus.Offline);
    }
}