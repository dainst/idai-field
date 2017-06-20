import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'conflict-deleted-modal',
    moduleId: module.id,
    templateUrl: './conflict-deleted-modal.html'
})
export class ConflictDeletedModalComponent {

    constructor(public activeModal: NgbActiveModal) {
    }
}