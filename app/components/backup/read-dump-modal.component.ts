import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
    moduleId: module.id,
    templateUrl: './read-dump-modal.html'
})
/**
 * @author Daniel de Oliveira
 */
export class ReadDumpModalComponent {

    constructor(public activeModal: NgbActiveModal) {}
}