import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SyncService } from 'idai-field-core';
import { reloadAndSwitchToHomeRoute} from '../../services/reload';
import { SettingsService } from '../../services/settings/settings-service';
import { M } from '../messages/m';
import { Messages } from '../messages/messages';
import { NetworkProjectProgressModalComponent } from './network-project-progress-modal.component';

const PouchDB = typeof window !== 'undefined' ? window.require('pouchdb-browser') : require('pouchdb-node');


@Component({
    templateUrl: './network-project.html'
})
/**
 * @author Daniel de Oliveira
 */
export class NetworkProjectComponent {

    public url: string = '';
    public projectName: string = '';
    public password: string = '';


    constructor(private messages: Messages,
                private syncService: SyncService,
                private settingsService: SettingsService,
                private modalService: NgbModal) {}


    public async onStartClicked() {

        const progressModalRef: any = this.modalService.open(
            NetworkProjectProgressModalComponent,
            { backdrop: 'static', keyboard: false }
        );
        progressModalRef.componentInstance.progressPercent = 0;

        const updateSequence: number = await this.getUpdateSequence();

        try {
            (await this.syncService.startOneTimeSync(this.url, this.password, this.projectName, updateSequence))
                .subscribe({
                    next: lastSequence => {
                        progressModalRef.componentInstance.progressPercent = (lastSequence / updateSequence * 100);
                    },
                    error: err => {
                        progressModalRef.close();
                        this.messages.add([M.INITIAL_SYNC_GENERIC_ERROR]);
                        console.log('SYNC_ERR', err);
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
                            progressModalRef.close();
                            reloadAndSwitchToHomeRoute();
                        });
                    }
                });
        } catch (e) {
            if (e === 'DB not empty') {
                this.messages.add([M.INITIAL_SYNC_DB_NOT_EMPTY]);
            } else {
                console.error('error from sync service startOneTimeSync', e);
            }
            progressModalRef.close();
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

        return info.update_seq;
    }
}
