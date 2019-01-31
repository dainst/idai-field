import {Component, Output, EventEmitter, Input, ElementRef, ViewChild} from '@angular/core';
import {Messages, Document} from 'idai-components-2';
import {UploadResult} from '../upload/upload-result';
import {UploadService} from '../upload/upload-service';

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

    @Output() onFilesUploaded: EventEmitter<UploadResult> = new EventEmitter<UploadResult>();

    @ViewChild('fileInput') fileInputElement: ElementRef;

    private dragOverActive: boolean = false;


    public constructor(
        private uploadService: UploadService,
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

        const uploadResult: UploadResult = await this.uploadService.startUpload(event,
            this.depictsRelationTarget);
        this.handleUploadResult(uploadResult);

        this.onDragLeave(event);
    }


    public async onSelectImages(event: any) {

        const uploadResult: UploadResult = await this.uploadService.startUpload(event,
            this.depictsRelationTarget);
        this.handleUploadResult(uploadResult);

        this.fileInputElement.nativeElement.value = null;
    }


    public getSupportedFileExtensions(): string {

        return UploadService.getSupportedFileTypes()
            .map(extension => '.' + extension)
            .join(',');
    }


    private handleUploadResult(uploadResult: UploadResult) {

        if (uploadResult.uploadedFiles > 0) this.onFilesUploaded.emit(uploadResult);

        for (let msgWithParams of uploadResult.messages) {
            this.messages.add(msgWithParams);
        }
    }
}
