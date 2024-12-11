import { Component, Input} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Document } from 'idai-field-core';
import { DocumentHolder } from '../docedit/document-holder';


@Component({
    selector: 'changes-history-dialog',
    templateUrl: './changes-history-dialog.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
        '(window:keyup)': 'onKeyUp($event)',
    }
    
})

export class ChangesHistoryDialogComponent {
    
    @Input() document: Document;
    
    public escapeKeyPressed: boolean;
    constructor( public activeModal: NgbActiveModal,
                 public documentHolder: DocumentHolder
    ) {}

    public async onKeyDown(event: KeyboardEvent) {
        console.log(this.document);
        if (event.key === 'Escape' && !this.escapeKeyPressed) {
            this.activeModal.dismiss('cancel');
        }
    }


    public async onKeyUp(event: KeyboardEvent) {
        if (event.key === 'Escape') this.escapeKeyPressed = false;
    }

}
