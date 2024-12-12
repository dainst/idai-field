import { Component} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DocumentHolder } from '../docedit/document-holder';


@Component({
    selector: 'changes-history-dialog',
    templateUrl: './changes-history-dialog.html',
    styleUrls: ['./changes-history-dialog.scss']
})

export class ChangesHistoryDialogComponent {

    public escapeKeyPressed: boolean;
    
    constructor( public activeModal: NgbActiveModal,
                 public documentHolder: DocumentHolder,
    ) {}

    public async onKeyDown(event: KeyboardEvent) {
        if (event.key === 'Escape' && !this.escapeKeyPressed) {
            this.activeModal.dismiss('cancel');
        }
    }


    public async onKeyUp(event: KeyboardEvent) {
        if (event.key === 'Escape') this.escapeKeyPressed = false;
    }

}
