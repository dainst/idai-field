import {ChangeDetectorRef, Component} from '@angular/core';
import {SettingsService} from '../../core/settings/settings-service';
import {RemoteChangesStream} from '../../core/datastore/core/remote-changes-stream';


@Component({
    moduleId: module.id,
    selector: 'taskbar',
    templateUrl: './taskbar.html'
})
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class TaskbarComponent {

    public connected: boolean = false;
    public receivingRemoteChanges: boolean = false;

    private remoteChangesTimeout: any = undefined;


    constructor(private changeDetectorRef: ChangeDetectorRef,
                settingsService: SettingsService,
                remoteChangesStream: RemoteChangesStream) {

        this.listenToSyncStatusChanges(settingsService);
        this.listenToRemoteChanges(remoteChangesStream);
    }


    private listenToSyncStatusChanges(settingsService: SettingsService) {

        settingsService.syncStatusChanges().subscribe(status => {
            if (status === 'connected') {
                this.connected = true;
                this.changeDetectorRef.detectChanges();
            } else if (status === 'disconnected') {
                this.connected = false;
                this.changeDetectorRef.detectChanges();
            }
        });
    }


    private listenToRemoteChanges(remoteChangesStream: RemoteChangesStream) {

        remoteChangesStream.notifications().subscribe(() => {
            this.receivingRemoteChanges = true;
            this.changeDetectorRef.detectChanges();

            if (this.remoteChangesTimeout) clearTimeout(this.remoteChangesTimeout);
            this.remoteChangesTimeout = setTimeout(() => {
                this.receivingRemoteChanges = false;
                this.changeDetectorRef.detectChanges();
            }, 2000);
        });
    }
}