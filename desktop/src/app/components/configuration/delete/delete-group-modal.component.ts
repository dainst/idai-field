import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Group } from 'idai-field-core';


@Component({
    templateUrl: './delete-group-modal.html'
})
/**
 * @author Thomas Kleinke
 */
export class DeleteGroupModalComponent {

    public group: Group;


    constructor(public activeModal: NgbActiveModal) {}


    public confirmDeletion() {

        this.activeModal.close();
    }


    public isDeletionAllowed() {

        console.log(this.group);
        console.log(this.group.fields.filter(field => field.visible));
        console.log(this.group.relations.filter(relation => relation.editable));

        return this.group.fields.filter(field => field.visible).length === 0
            && this.group.relations.filter(relation => relation.editable).length === 0;
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }
}
