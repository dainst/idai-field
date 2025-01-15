import { Component} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Document } from 'idai-field-core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'changes-history-modal',
    imports: [CommonModule],
    templateUrl: './changes-history-modal.html',
    styleUrls: ['./changes-history-modal.scss']
})

export class ChangesHistoryModalComponent {

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

    public async initialize() {
        // TODO remove this function  ( called in private function initModal() ) 
         1
    }

    public formatDateTime( date: string | Date, locale: string = 'de-DE' ) { 
        return new Date(date).toLocaleString(locale);
    }
}
