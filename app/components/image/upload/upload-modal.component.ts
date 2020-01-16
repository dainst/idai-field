import {Component} from '@angular/core';
import {UploadStatus} from './upload-status';

@Component({
    selector: 'upload-modal',
    moduleId: module.id,
    templateUrl: './upload-modal.html'
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