import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
    templateUrl: './add-group-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    }
})
/**
 * @author Thomas Kleinke
 */
export class AddGroupModalComponent {

    public groupName: string;


    constructor(public activeModal: NgbActiveModal) {}


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public createGroup() {

        if (!this.groupName) return;

        this.activeModal.close(this.groupName);
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }
}
