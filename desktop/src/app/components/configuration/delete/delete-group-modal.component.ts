import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Group } from 'idai-field-core';


@Component({
    templateUrl: './delete-group-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class DeleteGroupModalComponent {

    public group: Group;


    constructor(public activeModal: NgbActiveModal) {}

    
    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public confirmDeletion() {

        this.activeModal.close();
    }


    public isDeletionAllowed() {

        return this.group.fields.filter(field => field.visible).length === 0;
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }
}
