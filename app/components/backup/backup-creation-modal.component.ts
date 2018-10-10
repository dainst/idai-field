import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
    moduleId: module.id,
    templateUrl: './backup-creation-modal.html'
})
/**
 * @author Daniel de Oliveira
 */
export class BackupCreationModalComponent {

    constructor(public activeModal: NgbActiveModal) {}
}