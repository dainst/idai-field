import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'delete-qr-codemodal',
    templateUrl: './delete-qr-code-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})

/**
 * @author Thomas Kleinke
 */
export class DeleteQrCodeModalComponent {

    constructor(public activeModal: NgbActiveModal) {}


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }
}
