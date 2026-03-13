import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Menus } from '../../services/menus';
import { MenuContext } from '../../services/menu-context';


@Component({
    templateUrl: './confirm-backup-loading-modal.html',
    host: {
        'data-component-id': 'ConfirmBackupLoadingModalComponent',
        '(window:keydown)': 'onKeyDown($event)'
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class ConfirmBackupLoadingModalComponent {

    public warningType: 'unsimilarProjectIdentifier';
    public newProjectIdentifier: string;
    public originalProjectIdentifier: string;


    constructor(public activeModal: NgbActiveModal,
                private menuService: Menus) {}


    public confirm = () => this.activeModal.close();

    public cancel = () => this.activeModal.dismiss('cancel');


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.MODAL) {
            this.activeModal.dismiss('cancel');
        }
    }
}
