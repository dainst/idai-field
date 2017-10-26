import {Component, Output, EventEmitter} from "@angular/core";

@Component({
    selector: 'edit-save-dialog',
    moduleId: module.id,
    templateUrl: './edit-save-dialog.html'
})
export class EditSaveDialogComponent {


    @Output() onSave = new EventEmitter<any>();
    @Output() onDiscard = new EventEmitter<any>();
    @Output() onCancel = new EventEmitter<any>();
}