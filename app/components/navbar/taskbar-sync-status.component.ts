import {Component} from '@angular/core';
import {SynchronizationService} from '../../core/settings/synchronization-service';
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


    constructor(private synchronizationService: SynchronizationService) {

    }


    public getStatus = (): SyncStatus => this.synchronizationService.getStatus();

}
