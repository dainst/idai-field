import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
    templateUrl: './export-modal.html'
})
export class ExportModalComponent {

    constructor(public activeModal: NgbActiveModal) {}
}
