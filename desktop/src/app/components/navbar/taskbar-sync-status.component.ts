import { ChangeDetectorRef, Component } from '@angular/core';
import { SyncService, SyncStatus } from 'idai-field-core';
import { MenuNavigator } from '../menu-navigator';


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
                private changeDetectorRef: ChangeDetectorRef,
                private menuNavigator: MenuNavigator) {

        this.synchronizationService.statusNotifications().subscribe(() => {
            this.changeDetectorRef.detectChanges();
        });
    }


    public getStatus = (): SyncStatus => this.synchronizationService.getStatus();

    public openSynchronizationModal = () => this.menuNavigator.openSynchronizationModal();
}
