import {Component, Output, EventEmitter, Input} from '@angular/core';
import {Messages, Document} from 'idai-components-2';
import {ImageUploader, ImageUploadResult} from '../imageupload/image-uploader';

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

    @Input() depictsRelationTarget: Document|undefined;

    @Output() onImagesUploaded: EventEmitter<ImageUploadResult> = new EventEmitter<ImageUploadResult>();

    private dragOverActive = false;


    public constructor(
        private imageUploader: ImageUploader,
        private messages: Messages
    ) {}


    public onDragOver(event: any) {

        if (this.dragOverActive) return;

        this.dragOverActive = true;
        event.target.classList.add('dragover');
        event.preventDefault();
    }


    public onDragLeave(event: any) {

        this.dragOverActive = false;
        event.target.classList.remove('dragover');
    }


    public async onDrop(event: any) {

        event.preventDefault();

        const uploadResult: ImageUploadResult
            = await this.imageUploader.startUpload(event, this.depictsRelationTarget);
        this.handleUploadResult(uploadResult);

        this.onDragLeave(event);
    }


    public async onSelectImages(event: any) {

        const uploadResult: ImageUploadResult
            = await this.imageUploader.startUpload(event, this.depictsRelationTarget);
        this.handleUploadResult(uploadResult);
    }


    private handleUploadResult(uploadResult: ImageUploadResult) {

        if (uploadResult.uploadedImages > 0) this.onImagesUploaded.emit(uploadResult);

        for (let msgWithParams of uploadResult.messages) {
            this.messages.add(msgWithParams);
        }
    }
}
