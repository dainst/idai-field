import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
    templateUrl: './save-modal.html'
})
/**
 * @author Thomas Kleinke
 */
export class SaveModalComponent {

    constructor(public activeModal: NgbActiveModal) {}
}
