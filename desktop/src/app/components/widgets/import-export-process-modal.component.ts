import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
    templateUrl: './import-export-process-modal.html',
    standalone: false
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ImportExportProcessModalComponent {

    public type: 'import'|'export';


    constructor(public activeModal: NgbActiveModal) {}
}
