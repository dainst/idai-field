import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FieldDocument } from 'idai-field-core';
import { ResourceEditMode } from './resource-scanner';
import { Menus } from '../../../../services/menus';
import { MenuContext } from '../../../../services/menu-context';


@Component({
    templateUrl: './type-scanner-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    },
    standalone: false
})

/**
 * @author Thomas Kleinke
 */
export class TypeScannerModalComponent {

    public documents: Array<FieldDocument>;
    public typeDocuments: Array<FieldDocument>;
    public newTypeDocument: FieldDocument;


    constructor(public activeModal: NgbActiveModal,
                private menuService: Menus) {}


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.MODAL) {
            this.activeModal.dismiss('cancel');
        }
    }


    public selectEditMode(editMode: ResourceEditMode) {

        this.activeModal.close(editMode);
    }
}
