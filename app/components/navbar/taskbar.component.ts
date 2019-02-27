import {ChangeDetectorRef, Component} from '@angular/core';
import {Router} from '@angular/router';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {RemoteChangesStream} from '../../core/datastore/core/remote-changes-stream';
import {SynchronizationStatus} from '../../core/settings/synchronization-status';
import {TabManager} from '../tab-manager';


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
                private router: Router,
                private tabManager: TabManager,
                private i18n: I18n,
                remoteChangesStream: RemoteChangesStream) {

        this.listenToRemoteChanges(remoteChangesStream);
    }


    public isConnected = (): boolean => this.synchronizationStatus.isConnected();


    public async openTab(routeName: string) {

        await this.tabManager.openTab(routeName, this.getTabLabel(routeName));
        await this.router.navigate([routeName]);
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


    private getTabLabel(routeName: string): string {

        switch(routeName) {
            case 'help':
                return this.i18n({ id: 'navbar.taskbar.dropdown.help', value: 'Hilfe' });
            case 'import':
                return this.i18n({ id: 'navbar.taskbar.dropdown.import', value: 'Import' });
            case 'export':
                return this.i18n({ id: 'navbar.taskbar.dropdown.export', value: 'Export' });
            case 'backup-creation':
                return this.i18n(
                    { id: 'navbar.taskbar.dropdown.createBackup', value: 'Backup erstellen' }
                );
            case 'backup-loading':
                return this.i18n(
                    { id: 'navbar.taskbar.dropdown.restoreBackup', value: 'Backup einlesen' }
                );
            case 'settings':
                return this.i18n({ id: 'navbar.taskbar.dropdown.settings', value: 'Einstellungen' });
            default:
                return '';
        }
    }
}