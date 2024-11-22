import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Document } from 'idai-field-core';

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
    public CHANGESLIST: any[] = [
        { uiid: 1, name: 'Kurt Cobain', time: '1990-12-01 23:45', action: 'deleted' },
        { uiid: 2, name: 'Jacques Brel', time: '1968-02-12 20:30', action: 'created' },
        { uiid: 5, name: 'Pinkfloyd', time: '1980-08-11 20:35', action: 'modified' },
        { uiid: 3, name: 'Lou Reed', time: '1970-12-21 21:00', action: 'modified' }
    ];

    constructor(public activeModal: NgbActiveModal) {}

    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && !this.escapeKeyPressed) {
            this.activeModal.dismiss('cancel');
        }
    }


    public async onKeyUp(event: KeyboardEvent) {

        if (event.key === 'Escape') this.escapeKeyPressed = false;
    }

}
