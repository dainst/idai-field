import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FieldDocument } from 'idai-field-core';
import { StoragePlaceEditMode } from './storage-place-scanner';
import { Menus } from '../../../../services/menus';
import { MenuContext } from '../../../../services/menu-context';


@Component({
    templateUrl: './scan-storage-place-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    },
    standalone: false
})

/**
 * @author Thomas Kleinke
 */
export class ScanStoragePlaceModalComponent {

    public documents: Array<FieldDocument>;
    public storagePlaceDocuments: Array<FieldDocument>;
    public newStoragePlaceDocument: FieldDocument;


    constructor(public activeModal: NgbActiveModal,
                private menuService: Menus) {}


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.MODAL) {
            this.activeModal.dismiss('cancel');
        }
    }


    public selectEditMode(editMode: StoragePlaceEditMode) {

        this.activeModal.close(editMode);
    }
}
