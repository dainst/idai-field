import {Component} from '@angular/core';
import {SettingsService} from '../../core/settings/settings-service';


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


    constructor(private settings: SettingsService) {

        settings.syncStatusChanges().subscribe(c => {
            if (c === 'disconnected') {
                this.connected = false;
            } else if (c === 'connected') {
                this.connected = true;
            }
        });
    }
}