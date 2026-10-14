import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { MenuContext } from '../../../../services/menu-context';
import { Menus } from '../../../../services/menus';


@Component({
    templateUrl: './z-values-alert-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class ZValuesAlertModalComponent {

    public numberOfSelectedImages: number;


    constructor(public activeModal: NgbActiveModal,
                private menuService: Menus) {}


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.MODAL) {
            this.activeModal.dismiss('cancel');
        }
    }


    public confirm() {

        this.activeModal.close();
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }
}
