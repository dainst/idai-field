import { Component, Output, EventEmitter, Input, ElementRef, ViewChild } from '@angular/core';
import { Document } from 'idai-field-core';
import { ImageUploader, ImageUploadResult } from '../upload/image-uploader';
import { Messages } from '../../messages/messages';
import { MsgWithParams } from '../../messages/msg-with-params';
import { AppState } from '../../../services/app-state';

const remote = window.require('@electron/remote');


@Component({
    selector: 'drop-area',
    templateUrl: './drop-area.html'
})
/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DropAreaComponent {

    @Input() depictsRelationTarget: Document|undefined;

    @Output() onImagesUploaded = new EventEmitter<ImageUploadResult>();

    @ViewChild('fileInput', { static: false }) fileInputElement: ElementRef;

    protected dragOverActive: boolean = false;


    public constructor(protected imageUploader: ImageUploader,
                       protected messages: Messages,
                       protected appState: AppState) {}


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
        this.onDragLeave(event);

        const filePaths: string[] = DropAreaComponent.getFilePaths(event);
        await this.upload(filePaths);
    }


    public async selectFiles(event: MouseEvent) {

        event.preventDefault();

        const result: any = await remote.dialog.showOpenDialog(
            remote.getCurrentWindow(),
            {
                properties: ['openFile', 'multiSelections'],
                defaultPath: this.appState.getFolderPath('imageUpload'),
                buttonLabel: $localize `:@@openFileDialog.select:Auswählen`,
                filters: [
                    {
                        name: $localize `:@@import.selectFile.filters.all:Alle unterstützten Formate`,
                        extensions: ImageUploader.supportedImageFileTypes.concat(ImageUploader.supportedWorldFileTypes)
                    },
                    {
                        name: 'JPEG',
                        extensions: ['jpg', 'jpeg']
                    },
                    {
                        name: 'PNG',
                        extensions: ['png']
                    },
                    {
                        name: 'TIFF',
                        extensions: ['tif', 'tiff']
                    },
                    {
                        name: 'Worldfile',
                        extensions: ImageUploader.supportedWorldFileTypes
                    }
                ]
            }
        );

        if (result.filePaths.length) {
            this.appState.setFolderPath(result.filePaths[0], 'imageUpload');
            await this.upload(result.filePaths);
        }
    }


    public getSupportedFileExtensions(): string {

        return ImageUploader.supportedImageFileTypes
            .concat(ImageUploader.supportedWorldFileTypes)
            .map(extension => '.' + extension)
            .join(',');
    }


    private async upload(filePaths: string[]) {

        const uploadResult: ImageUploadResult = await this.imageUploader.startUpload(
            filePaths, this.depictsRelationTarget
        );

        this.handleUploadResult(uploadResult);
    }


    private handleUploadResult(uploadResult: ImageUploadResult) {

        if (uploadResult.uploadedImages > 0) this.onImagesUploaded.emit(uploadResult);

        for (let msgWithParams of uploadResult.messages) {
            this.messages.add(msgWithParams as MsgWithParams);
        }
    }


    private static getFilePaths(event: any): string[] {

        return event?.dataTransfer?.files
            ? Array.from(event?.dataTransfer?.files).map((file: any) => file.path)
            : [];
    }
}
