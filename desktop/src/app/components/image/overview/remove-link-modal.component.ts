import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
    selector: 'remove-link-modal',
    templateUrl: './remove-link-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
export class RemoveLinkModalComponent {

    constructor(public activeModal: NgbActiveModal) {}


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }
}
