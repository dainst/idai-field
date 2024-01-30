import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FieldDocument } from 'idai-field-core';


@Component({
    templateUrl: './delete-qr-code-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Thomas Kleinke
 */
export class DeleteQrCodeModalComponent {

    public document: FieldDocument;


    constructor(public activeModal: NgbActiveModal) {}


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }
}
