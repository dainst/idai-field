import { Component} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Document } from 'idai-field-core';


@Component({
    selector: 'changes-history-dialog',
    templateUrl: './changes-history-dialog.html',
    styleUrls: ['./changes-history-dialog.scss']
})

export class ChangesHistoryDialogComponent {

    public escapeKeyPressed: boolean;
    public document: Document;

    constructor( public activeModal: NgbActiveModal,
    ) {}


    public async onKeyDown(event: KeyboardEvent) {
        if (event.key === 'Escape' && !this.escapeKeyPressed) {
            this.activeModal.dismiss('cancel');
        }
        
    }


    public async onKeyUp(event: KeyboardEvent) {
        if (event.key === 'Escape') this.escapeKeyPressed = false;
    }


    public formatDateTime( date: string | Date, locale: string = 'de-DE' ) { 
        return new Date(date).toLocaleString(locale);
    }
}
