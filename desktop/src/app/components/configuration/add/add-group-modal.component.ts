import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
    templateUrl: './add-group-modal.html'
})
/**
 * @author Thomas Kleinke
 */
export class AddGroupModalComponent {

    public groupName: string;


    constructor(public activeModal: NgbActiveModal) {}


    public createGroup() {

        if (!this.groupName) return;

        this.activeModal.close(this.groupName);
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }
}
