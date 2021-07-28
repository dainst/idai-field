import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Field } from 'idai-field-core';


@Component({
    templateUrl: './delete-field-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    }
})
/**
 * @author Thomas Kleinke
 */
export class DeleteFieldModalComponent {

    public field: Field;


    constructor(public activeModal: NgbActiveModal) {}


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public confirmDeletion() {

        this.activeModal.close();
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }
}
