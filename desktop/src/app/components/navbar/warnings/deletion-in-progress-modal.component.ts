import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
    selector: 'deletion-in-progress-modal',
    templateUrl: './deletion-in-progress-modal.html'
})
/**
 * @author Thomas Kleinke
 */
export class DeletionInProgressModalComponent {

    constructor(public activeModal: NgbActiveModal) {}

    public mode: 'resource'|'field';
    public multiple: boolean;
}
