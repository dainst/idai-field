import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ImageStore, ImageDocument, ImageVariant } from 'idai-field-core';
import { AngularUtility } from '../../../angular/angular-utility';
import { SettingsProvider } from '../../../services/settings/settings-provider';
import { Messages } from '../../messages/messages';
import { M } from '../../messages/m';
import { RemoteImageStore } from '../../../services/imagestore/remote-image-store';


export type ImageDownloadRequest = {
    image: ImageDocument;
    downloadThumbnail: boolean;
};


/**
 * @author Thomas Kleinke
 */
@Component({
    selector: 'image-download-modal',
    templateUrl: './image-download-modal.html',
    standalone: false
})
export class ImageDownloadModalComponent implements OnInit {

    public downloadRequests: Array<ImageDownloadRequest>;
    public processedImagesCount: number = 0;
    public cancelling: boolean = false;


    constructor(public activeModal: NgbActiveModal,
                private imageStore: ImageStore,
                private remoteImageStore: RemoteImageStore,
                private settingsProvider: SettingsProvider,
                private messages: Messages) {}


    public cancel = () => this.cancelling = true;


    async ngOnInit() {
        
        AngularUtility.blurActiveElement();
        await this.downloadImages();
    }


    public getProgress(): number {

        return (this.processedImagesCount / this.downloadRequests.length) * 100;
    }


    private async downloadImages() {

        this.processedImagesCount = 0;

        for (let request of this.downloadRequests) {
            if (this.cancelling) {
                this.activeModal.dismiss('canceled');
                return;
            }
            try {
                await this.downloadImage(request);
                this.processedImagesCount++;
            } catch (err) {
                console.error(err);
                this.messages.add([M.IMAGES_ERROR_DOWNLOAD_FAILED, request.image.resource.identifier]);
                this.activeModal.dismiss('error');
                return;
            }
        }
        
        if (this.downloadRequests.length > 1) await AngularUtility.refresh(1000);
        this.showSuccessMessage();
        this.activeModal.close();
    }


    private async downloadImage(request: ImageDownloadRequest) {

        const project: string = this.settingsProvider.getSettings().selectedProject;

        await this.downloadImageVariant(request.image, project, ImageVariant.ORIGINAL);

        if (request.downloadThumbnail) {
            await this.downloadImageVariant(request.image, project, ImageVariant.THUMBNAIL);
        }
    }


    private async downloadImageVariant(image: ImageDocument, project: string, variant: ImageVariant) {

        const data: Buffer = await this.remoteImageStore.getData(
            image.resource.id,
            variant,
            project
        );

        await this.imageStore.store(
            image.resource.id,
            data,
            project,
            variant
        );
    }


    private showSuccessMessage() {

        if (this.downloadRequests.length === 1) {
            this.messages.add([M.IMAGES_SUCCESS_IMAGES_DOWNLOADED_SINGLE]);
        } else {
            this.messages.add([
                M.IMAGES_SUCCESS_IMAGES_DOWNLOADED_MULTIPLE,
                this.downloadRequests.length.toString()
            ]);
        }
    }
}
