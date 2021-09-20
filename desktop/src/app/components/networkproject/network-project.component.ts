import { Component } from '@angular/core';
import { SyncService } from 'idai-field-core';

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


    constructor(private syncService: SyncService) {}


    public async onStartClicked() {

        (await this.syncService.startOneTimeSync(this.url, this.password, this.projectName))
            .subscribe(item => {

                console.log('SYNC_INFO', item);
            });
    }


    public async onKeyDown(event: KeyboardEvent) {} //  TODO review if necessary
}
