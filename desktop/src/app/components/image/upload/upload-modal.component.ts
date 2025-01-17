import { Component } from '@angular/core';
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

    constructor(
        public uploadStatus: UploadStatus
    ) {}
}
