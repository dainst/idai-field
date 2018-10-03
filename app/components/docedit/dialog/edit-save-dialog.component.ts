import {Component, Output, EventEmitter} from "@angular/core";
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'edit-save-dialog',
    moduleId: module.id,
    templateUrl: './edit-save-dialog.html'
})
export class EditSaveDialogComponent {

    constructor(public activeModal: NgbActiveModal) {}
}