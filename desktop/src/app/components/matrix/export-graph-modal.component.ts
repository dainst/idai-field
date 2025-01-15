import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { IdGenerator } from 'idai-field-core';


@Component({
    templateUrl: './export-graph-modal.html',
    standalone: false,
    host: { hostID: new IdGenerator().generateId() }
})
/**
 * @author Thomas Kleinke
 */
export class ExportGraphModalComponent {

    constructor(public activeModal: NgbActiveModal) {}
}
