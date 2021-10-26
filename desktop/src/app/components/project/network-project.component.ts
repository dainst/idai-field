import { Component } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Menus } from '../../services/menus';
import { SyncService } from 'idai-field-core';
import { M } from '../messages/m';
import { Messages } from '../messages/messages';
import { NetworkProjectProgressModalComponent } from './network-project-progress-modal.component';
import { TabManager } from '../../services/tabs/tab-manager';
import { SettingsService } from '../../services/settings/settings-service';
import { MenuContext } from '../../services/menu-context';
import { reloadAndSwitchToHomeRoute } from '../../services/reload';
import { SettingsProvider } from '../../services/settings/settings-provider';

const PouchDB = typeof window !== 'undefined' ? window.require('pouchdb-browser') : require('pouchdb-node');


@Component({
    templateUrl: './network-project.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class NetworkProjectComponent {

    public url: string = '';
    public projectName: string = '';
    public password: string = '';


    constructor(private messages: Messages,
                private syncService: SyncService,
                private settingsService: SettingsService,
                private settingsProvider: SettingsProvider,
                private modalService: NgbModal,
                private menuService: Menus,
                private tabManager: TabManager) {}


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.DEFAULT) {
            await this.tabManager.openActiveTab();
        }
    }

    public async onStartClicked() {

        this.menuService.setContext(MenuContext.MODAL);

        const progressModalRef: NgbModalRef = this.modalService.open(
            NetworkProjectProgressModalComponent,
            { backdrop: 'static', keyboard: false }
        );
        progressModalRef.componentInstance.progressPercent = 0;
        progressModalRef.result.catch(canceled => {
            this.syncService.stopReplication();
            this.closeModal(progressModalRef);
        });

        let updateSequence: number;
        try {
            updateSequence = await this.getUpdateSequence();
        } catch (err) {
            if (err === 'invalidCredentials') {
                this.messages.add([M.INITIAL_SYNC_INVALID_CREDENTIALS]);
            } else {
                this.messages.add([M.INITIAL_SYNC_GENERIC_ERROR]);
                console.error('Error while trying to fetch update sequence of network project:', err);
            }
            return this.closeModal(progressModalRef);
        }

        const destroyExisting: boolean = !this.settingsProvider.getSettings().dbs.includes(this.projectName);

        try {
            (await this.syncService.startReplication(
                this.url, this.password, this.projectName, updateSequence, destroyExisting
            )).subscribe({
                next: lastSequence => {
                    const lastSequenceNumber: number = NetworkProjectComponent.parseSequenceNumber(lastSequence);
                    progressModalRef.componentInstance.progressPercent = Math.min(
                        (lastSequenceNumber / updateSequence * 100), 100
                    );
                },
                error: err => {
                    this.closeModal(progressModalRef);
                    if (err === 'canceled') return;
                    if (err.error === 'unauthorized') {
                        this.messages.add([M.INITIAL_SYNC_INVALID_CREDENTIALS]);
                    } else {
                        this.messages.add([M.INITIAL_SYNC_GENERIC_ERROR]);
                        console.error('Error while replicating network project:', err);
                    }
                },
                complete: () => {
                    this.settingsService.addProject(
                        this.projectName,
                        {
                            isSyncActive: true,
                            address: this.url,
                            password: this.password
                        }
                    ).then(() => {
                        this.closeModal(progressModalRef);
                        reloadAndSwitchToHomeRoute();
                    });
                }
            });
        } catch (e) {
            if (e === 'DB not empty') {
                this.messages.add([M.INITIAL_SYNC_DB_NOT_EMPTY]);
            } else {
                this.messages.add([M.INITIAL_SYNC_COULD_NOT_START_GENERIC_ERROR]);
                console.error('error from sync service startOneTimeSync', e);
            }
            this.closeModal(progressModalRef);
        }
    }


    private async getUpdateSequence(): Promise<number> {

        const info = await new PouchDB(
            SyncService.generateUrl(this.url + '/' + this.projectName, this.projectName),
            {
                skip_setup: true,
                auth: {
                    username: this.projectName,
                    password: this.password
                }
            }
        ).info();

        if (info.status === 401) throw 'invalidCredentials';

        return NetworkProjectComponent.parseSequenceNumber(info.update_seq);
    }


    private closeModal(modalRef: NgbModalRef) {

        modalRef.close();
        this.menuService.setContext(MenuContext.DEFAULT);
    }


    private static parseSequenceNumber(updateSequence: number|string): number {

        return Number.parseInt((updateSequence + '').split('-')[0]);
    }
}
