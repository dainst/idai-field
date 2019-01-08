import {Component, HostListener} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'edit-save-dialog',
    moduleId: module.id,
    templateUrl: './edit-save-dialog.html'
})
export class EditSaveDialogComponent {

    constructor(public activeModal: NgbActiveModal) {}


    @HostListener('window:keydown', ['$event'])
    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.close('cancel');
    }
}