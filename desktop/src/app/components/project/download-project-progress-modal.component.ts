import { ChangeDetectorRef, Component } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AngularUtility } from '../../angular/angular-utility';
import { CancelModalComponent } from './cancel-modal.component';


@Component({
    templateUrl: './download-project-progress-modal.html',
    standalone: false
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DownloadProjectProgressModalComponent {

    public databaseProgressPercent: number;
    public filesProgressPercent: number;
    public cancelFunction: () => Promise<void>;
    
    public cancelling: boolean = false;


    constructor(public activeModal: NgbActiveModal,
                private modalService: NgbModal,
                private changeDetectorRef: ChangeDetectorRef) {}


    public getRoundedProgress(progressPercent: number): number {

        return Math.floor(progressPercent);
    }


    public setDatabaseProgressPercent(databaseProgressPercent: number) {

        this.databaseProgressPercent = databaseProgressPercent;
        this.changeDetectorRef.detectChanges();
    }


    public async cancel() {

        const modalRef: NgbModalRef = this.modalService.open(
            CancelModalComponent,
            { backdrop: 'static', animation: false }
        );
        
        try {
            await modalRef.result;
            this.cancelling = true;
            await this.cancelFunction();
        } catch (_) {
            // Do not cancel
            AngularUtility.blurActiveElement();
        }
    }
}
