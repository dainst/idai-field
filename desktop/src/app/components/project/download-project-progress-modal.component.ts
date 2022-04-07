import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CancelModalComponent } from './cancel-modal.component';


@Component({
    templateUrl: './download-project-progress-modal.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DownloadProjectProgressModalComponent {

    public databaseProgressPercent: number;
    public filesProgressPercent: number;


    constructor(public activeModal: NgbActiveModal,
                private modalService: NgbModal) {}


    public getRoundedProgress(progressPercent: number): number {

        return Math.floor(progressPercent);
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