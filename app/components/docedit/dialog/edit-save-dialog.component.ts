import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'edit-save-dialog',
    moduleId: module.id,
    templateUrl: './edit-save-dialog.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    }
})
export class EditSaveDialogComponent {

    constructor(public activeModal: NgbActiveModal) {}


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.close('cancel');
    }
}