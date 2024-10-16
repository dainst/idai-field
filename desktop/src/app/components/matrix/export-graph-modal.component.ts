import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
    templateUrl: './export-graph-modal.html'
})
/**
 * @author Thomas Kleinke
 */
export class ExportGraphModalComponent {

    constructor(public activeModal: NgbActiveModal) {}
}
