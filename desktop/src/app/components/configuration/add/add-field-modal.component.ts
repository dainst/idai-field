import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
    templateUrl: './add-field-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    }
})
/**
 * @author Thomas Kleinke
 */
export class AddFieldModalComponent {

    public fieldName: string;


    constructor(public activeModal: NgbActiveModal) {}


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public createField() {

        if (!this.fieldName) return;

        this.activeModal.close(this.fieldName);
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }
}
