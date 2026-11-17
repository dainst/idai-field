import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
    templateUrl: './save-modal.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class SaveModalComponent {

    constructor(public activeModal: NgbActiveModal) {}


    public confirm = () => this.activeModal.close();

    public cancel = () => this.activeModal.dismiss('cancel');
}
