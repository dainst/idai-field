import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'remove-link-modal',
    moduleId: module.id,
    templateUrl: './remove-link-modal.html'
})
export class RemoveLinkModalComponent {

    constructor(public activeModal: NgbActiveModal) {}
}