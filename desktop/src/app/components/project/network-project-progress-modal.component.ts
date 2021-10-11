import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CancelModalComponent } from './cancel-modal.component';


@Component({
    templateUrl: './network-project-progress-modal.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class NetworkProjectProgressModalComponent {

    public progressPercent: number;

    constructor(public activeModal: NgbActiveModal,
                private modalService: NgbModal) {}


    public getRoundedProgress(): number {

        return Math.floor(this.progressPercent);
    }


    public async cancel() {

        const modalRef: NgbModalRef = this.modalService.open(
            CancelModalComponent,
            { backdrop: 'static' }
        );
        
        try {
            await modalRef.result;
            this.activeModal.dismiss('cancel');
        } catch (_) {
            // Do not cancel
        }
    }
}
