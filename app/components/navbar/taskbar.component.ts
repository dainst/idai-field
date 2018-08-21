import {Component, ElementRef, Renderer2, ViewChild} from '@angular/core';
import {Document} from 'idai-components-2';
import {SettingsService} from '../../core/settings/settings-service';
import {RoutingService} from '../routing-service';
import {DocumentReadDatastore} from '../../core/datastore/document-read-datastore';
import {IndexFacade} from '../../core/datastore/index/index-facade';


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

    public connected = false;



    constructor(private settings: SettingsService) {

        settings.syncStatusChanges().subscribe(c => {
            if (c == 'disconnected') {
                this.connected = false;
            } else if (c == 'connected') {
                this.connected = true;
            }
        });
    }
}