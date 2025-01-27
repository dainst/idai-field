import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { IdGenerator } from 'idai-field-core';


@Component({
    templateUrl: './export-modal.html',
    standalone: false,
    host: { hostID: new IdGenerator().generateId() }
})
export class ExportModalComponent {

    constructor(public activeModal: NgbActiveModal) {}
}
