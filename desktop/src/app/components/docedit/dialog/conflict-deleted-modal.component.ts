import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { MenuContext } from '../../../services/menu-context';
import { Menus } from '../../../services/menus';


@Component({
    selector: 'conflict-deleted-modal',
    templateUrl: './conflict-deleted-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    },
    standalone: false
})
export class ConflictDeletedModalComponent {

    constructor(public activeModal: NgbActiveModal,
                private menuService: Menus) {}


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.MODAL) {
            this.activeModal.dismiss('cancel');
        }
    }
}
