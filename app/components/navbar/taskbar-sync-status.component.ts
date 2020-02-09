import {Component} from '@angular/core';
import {SynchronizationStatus} from '../../core/settings/synchronization-status';
import { SyncStatus } from '../../core/datastore/pouchdb/sync-process';


@Component({
    moduleId: module.id,
    selector: 'taskbar-sync-status',
    templateUrl: './taskbar-sync-status.html'
})
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class TaskbarSyncStatusComponent {


    constructor(private synchronizationStatus: SynchronizationStatus) {

    }


    public getStatus = (): SyncStatus => this.synchronizationStatus.getStatus();

}
