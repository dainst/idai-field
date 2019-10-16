import {ChangeDetectorRef, Component} from '@angular/core';
import {ChangesStream} from '../../core/datastore/core/changes-stream.service';
import {SynchronizationStatus} from '../../core/settings/synchronization-status';


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

    public receivingRemoteChanges: boolean = false;

    private remoteChangesTimeout: any = undefined;


    constructor(private changeDetectorRef: ChangeDetectorRef,
                private synchronizationStatus: SynchronizationStatus,
                remoteChangesStream: ChangesStream) {

        this.listenToRemoteChanges(remoteChangesStream);
    }


    public isConnected = (): boolean => this.synchronizationStatus.isConnected();


    private listenToRemoteChanges(remoteChangesStream: ChangesStream) {

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