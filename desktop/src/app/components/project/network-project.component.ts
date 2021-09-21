import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SyncService } from 'idai-field-core';
import { reloadAndSwitchToHomeRoute} from '../../services/reload';
import { SettingsService } from '../../services/settings/settings-service';
import { M } from '../messages/m';
import { Messages } from '../messages/messages';
import { NetworkProjectProgressModalComponent } from './network-project-progress-modal.component';


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

        try {
            (await this.syncService.startOneTimeSync(this.url, this.password, this.projectName))
                .subscribe({
                    next: item => { console.log('SYNC_INFO', item); },
                    error: err => {
                        progressModalRef.close();
                        this.messages.add([M.INITIAL_SYNC_GENERIC_ERROR]);
                        console.log('SYNC_ERR', err);
                    },
                    complete: () => {
                        // this.messages.add([M.INITIAL_SYNC_COMPLETE]); TODO remove message

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
}
