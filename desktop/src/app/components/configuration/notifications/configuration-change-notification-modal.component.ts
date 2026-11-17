import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { reload } from '../../../services/reload';


@Component({
    templateUrl: './configuration-change-notification-modal.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class ConfigurationChangeNotificationModalComponent {

    constructor(public activeModal: NgbActiveModal) {}


    public reloadProject() {

        reload();
    }
}
