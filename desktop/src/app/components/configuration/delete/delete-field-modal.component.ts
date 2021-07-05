import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FieldDefinition } from 'idai-field-core';


@Component({
    templateUrl: './delete-field-modal.html'
})
/**
 * @author Thomas Kleinke
 */
export class DeleteFieldModalComponent {

    public field: FieldDefinition;


    constructor(public activeModal: NgbActiveModal) {}


    public confirmDeletion() {

        this.activeModal.close();
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }
}
