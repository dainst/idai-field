import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'conflict-modal',
    moduleId: module.id,
    templateUrl: './conflict-modal.html'
})
export class ConflictModalComponent {

    constructor(public activeModal: NgbActiveModal) {

    }

}