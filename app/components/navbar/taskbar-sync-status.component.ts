import {Component} from '@angular/core';
import {SyncService} from '../../core/settings/sync-service';
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


    constructor(private synchronizationService: SyncService) {

    }


    public getStatus = (): SyncStatus => this.synchronizationService.getStatus();

}
