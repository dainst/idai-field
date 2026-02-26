import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UploadStatus } from './upload-status';


@Component({
    selector: 'upload-modal',
    templateUrl: './upload-modal.html',
    standalone: false
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class UploadModalComponent {

    constructor(public activeModal: NgbActiveModal,
                public uploadStatus: UploadStatus) {}
}
