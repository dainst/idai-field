import { Component } from '@angular/core';
import { SyncService } from 'idai-field-core';
import { M } from '../messages/m';
import { Messages } from '../messages/messages';

@Component({
    templateUrl: './network-project.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Daniel de Oliveira
 */
export class NetworkProjectComponent {

    public url = 'localhost:5984';

    public projectName = 'synctest';

    public password = 'synctest';


    constructor(private messages: Messages,
                private syncService: SyncService) {}


    public async onStartClicked() {

        // TODO don't do it if project already exists locally

        (await this.syncService.startOneTimeSync(this.url, this.password, this.projectName))
            .subscribe({
                next: item => {
                    console.log('SYNC_INFO', item);
                },
                error: err => {
                    console.log('SYNC_ERR', err);
                },
                complete: () => {
                    this.messages.add(
                        [M.INITIAL_SYNC_COMPLETE]
                    );

                    // TODO add sync info to config.json
                }
            });
    }


    public async onKeyDown(event: KeyboardEvent) {} //  TODO review if it is necessary
}
