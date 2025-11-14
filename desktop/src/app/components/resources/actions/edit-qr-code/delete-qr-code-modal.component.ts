import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FieldDocument } from 'idai-field-core';
import { MenuContext } from '../../../../services/menu-context';
import { Menus } from '../../../../services/menus';


@Component({
    templateUrl: './delete-qr-code-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class DeleteQrCodeModalComponent {

    public document: FieldDocument;


    constructor(public activeModal: NgbActiveModal,
                private menuService: Menus
    ) {}


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.MODAL) {
            this.activeModal.dismiss('cancel');
        }
    }
}
