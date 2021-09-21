import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
    templateUrl: './network-project-progress-modal.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class NetworkProjectProgressModalComponent {

    public progressPercent: number;

    constructor(public activeModal: NgbActiveModal) {}


    public getRoundedProgress(): number {

        return Math.floor(this.progressPercent);
    }
}
