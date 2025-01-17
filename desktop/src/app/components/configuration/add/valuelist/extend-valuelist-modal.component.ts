import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Valuelist } from 'idai-field-core';


@Component({
    templateUrl: './extend-valuelist-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class ExtendValuelistModalComponent {

    public valuelistToExtend: Valuelist;

    public newValuelistId: string;


    constructor(public activeModal: NgbActiveModal) {}


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public confirm() {

        if (!this.newValuelistId) return;

        this.activeModal.close(this.newValuelistId);
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }
}
