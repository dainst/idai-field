import { Component} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Document } from 'idai-field-core';


@Component({
    selector: 'changes-history-modal',
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
        // this.category = this.projectConfiguration.getCategory(this.document.resource.category);
        // this.printedFields = await this.getPrintedFields();
        1
    }

    public formatDateTime( date: string | Date, locale: string = 'de-DE' ) { 
        return new Date(date).toLocaleString(locale);
    }
}
