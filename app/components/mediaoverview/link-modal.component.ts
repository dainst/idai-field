import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'link-modal',
    moduleId: module.id,
    templateUrl: './link-modal.html'
})
export class LinkModalComponent {

    constructor(public activeModal: NgbActiveModal) {}
}