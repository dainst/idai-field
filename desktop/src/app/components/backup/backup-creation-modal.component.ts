import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { IdGenerator } from 'idai-field-core';


@Component({
    templateUrl: './backup-creation-modal.html',
    standalone: false,
    host: { hostID: new IdGenerator().generateId() }
})
/**
 * @author Daniel de Oliveira
 */
export class BackupCreationModalComponent {

    constructor(public activeModal: NgbActiveModal) {}
}
