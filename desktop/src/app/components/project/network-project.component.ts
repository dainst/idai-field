import { Component } from '@angular/core';
import { SyncService } from 'idai-field-core';
import { reloadAndSwitchToHomeRoute} from '../../services/reload';
import { SettingsService } from '../../services/settings/settings-service';
import { M } from '../messages/m';
import { Messages } from '../messages/messages';


@Component({
    templateUrl: './network-project.html'
})
/**
 * @author Daniel de Oliveira
 */
export class NetworkProjectComponent {

    public url = 'localhost:5984';
    public projectName = 'synctest-1';
    public password = 'synctest-1';


    constructor(private messages: Messages,
                private syncService: SyncService,
                private settingsService: SettingsService) {}


    public async onStartClicked() {

        try {
            (await this.syncService.startOneTimeSync(this.url, this.password, this.projectName))
                .subscribe({
                    next: item => { console.log('SYNC_INFO', item); },
                    error: err => {
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
        }
    }
}
