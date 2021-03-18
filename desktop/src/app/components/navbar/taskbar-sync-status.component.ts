import {ChangeDetectorRef, Component} from '@angular/core';
import {SyncService} from '../../core/sync/sync-service';
import {SyncStatus} from '../../core/sync/sync-process';


@Component({
    selector: 'taskbar-sync-status',
    templateUrl: './taskbar-sync-status.html'
})
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class TaskbarSyncStatusComponent {

    constructor(private synchronizationService: SyncService,
                private changeDetectorRef: ChangeDetectorRef) {

        this.synchronizationService.statusNotifications().subscribe(() => {
            this.changeDetectorRef.detectChanges();
        });
    }


    public getStatus = (): SyncStatus => this.synchronizationService.getStatus();
}
