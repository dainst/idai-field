import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
    templateUrl: './backup-loading-modal.html'
})
/**
 * @author Daniel de Oliveira
 */
export class BackupLoadingModalComponent {

    constructor(public activeModal: NgbActiveModal) {}
}
