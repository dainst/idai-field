import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
    selector: 'fixing-data-in-progress-modal',
    templateUrl: './fixing-data-in-progress-modal.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class FixingDataInProgressModalComponent {

    public multiple: boolean;

    constructor(public activeModal: NgbActiveModal) {}
}
