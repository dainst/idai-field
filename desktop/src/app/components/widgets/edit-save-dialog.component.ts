import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Menus } from '../../services/menus';
import { MenuContext } from '../../services/menu-context';


@Component({
    selector: 'edit-save-dialog',
    templateUrl: './edit-save-dialog.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
        '(window:keyup)': 'onKeyUp($event)',
    },
    standalone: false
})
export class EditSaveDialogComponent {

    public changeMessage: string;
    public escapeKeyPressed: boolean;
    public applyMode: boolean;


    constructor(public activeModal: NgbActiveModal,
                private menuService: Menus) {}


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && !this.escapeKeyPressed && this.menuService.getContext() === MenuContext.MODAL) {
            this.activeModal.dismiss('cancel');
        }
    }


    public async onKeyUp(event: KeyboardEvent) {

        if (event.key === 'Escape') this.escapeKeyPressed = false;
    }
}
