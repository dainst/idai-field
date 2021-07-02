import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
    templateUrl: './add-field-modal.html'
})
/**
 * @author Thomas Kleinke
 */
export class AddFieldModalComponent {

    public fieldName: string;


    constructor(public activeModal: NgbActiveModal) {}


    public createField() {

        if (!this.fieldName) return;

        this.activeModal.close(this.fieldName);
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }
}
