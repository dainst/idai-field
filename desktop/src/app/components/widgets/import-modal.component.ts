import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
    templateUrl: './import-modal.html',
    standalone: false
})
/**
 * @author Daniel de Oliveira
 */
export class ImportModalComponent {

    constructor(public activeModal: NgbActiveModal) {}


    public close() {

        this.activeModal.close();
    }
}
