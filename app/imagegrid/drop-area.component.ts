import {Component, Output, EventEmitter} from '@angular/core';
import {ImageUploader, ImageUploadResult} from '../imageupload/image-uploader';
import {Messages} from 'idai-components-2/messages';

@Component({
    selector: 'drop-area',
    moduleId: module.id,
    templateUrl: './drop-area.html'
})
/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DropAreaComponent {

    @Output() onImagesUploaded: EventEmitter<any> = new EventEmitter<any>();

    private dragOverActive = false;


    public constructor(
        private imageUploader: ImageUploader,
        private messages: Messages
    ) {}


    public onDragOver(event) {

        if (this.dragOverActive) return;

        this.dragOverActive = true;
        event.target.classList.add('dragover');
        event.preventDefault();
    }


    public onDragLeave(event) {

        this.dragOverActive = false;
        event.target.classList.remove('dragover');
    }


    public onDrop(event) {

        event.preventDefault();
        this.imageUploader.startUpload(event).then(uploadResult => this.handleUploadResult(uploadResult));
        this.onDragLeave(event);
    }


    public onSelectImages(event) {

        this.imageUploader.startUpload(event).then(uploadResult => this.handleUploadResult(uploadResult));
    }


    private handleUploadResult(uploadResult: ImageUploadResult) {

        if (uploadResult.uploadedImages > 0) this.onImagesUploaded.emit();

        for (let msgWithParams of uploadResult.messages) {
            this.messages.add(msgWithParams);
        }
    }
}
