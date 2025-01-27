import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
    templateUrl: './cancel-modal.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class CancelModalComponent {

    constructor(public activeModal: NgbActiveModal) {}
}
