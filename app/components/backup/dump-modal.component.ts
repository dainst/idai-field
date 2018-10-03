import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
    moduleId: module.id,
    templateUrl: './dump-modal.html'
})
/**
 * @author Daniel de Oliveira
 */
export class DumpModalComponent {

    constructor(public activeModal: NgbActiveModal) {}
}