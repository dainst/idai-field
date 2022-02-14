import { ChangeDetectorRef, Component } from '@angular/core';
import { SyncService, SyncStatus, ImageSyncService, ImageVariant } from 'idai-field-core';
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

    constructor(private pouchSyncService: SyncService,
                private imageSyncService: ImageSyncService,
                private changeDetectorRef: ChangeDetectorRef,
                private menuNavigator: MenuNavigator) {

        this.pouchSyncService.statusNotifications().subscribe(() => {
            this.changeDetectorRef.detectChanges();
        });
    }


    public getStatus = (): SyncStatus => {

        const status: SyncStatus = this.pouchSyncService.getStatus();

        // If pouch DB is still syncing, do not evaluate image syncing status.
        if (status !== SyncStatus.InSync) return status;

        const imageStatus = this.imageSyncService.getStatus();

        for (const variant in imageStatus) {
            if (imageStatus[variant] !== SyncStatus.InSync) {
                return imageStatus[variant];
            }
        }

        return SyncStatus.InSync;
    }

    public openSynchronizationModal = () => this.menuNavigator.openSynchronizationModal();
}
