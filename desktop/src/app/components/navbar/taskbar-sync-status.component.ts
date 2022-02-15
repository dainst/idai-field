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

        // If any image variant status is anything else than offline or in sync, use that one as
        // overall status.
        for (const variant in imageStatus) {
            if (![SyncStatus.InSync, SyncStatus.Offline].includes(imageStatus[variant])) {
                return imageStatus[variant];
            }
        }

        return SyncStatus.InSync;
    }

    public openSynchronizationModal = () => this.menuNavigator.openSynchronizationModal();
}
