import { Component, OnChanges, Input, NgZone, ChangeDetectorRef } from '@angular/core';
import { ImageDocument, ImageStore, ImageVariant } from 'idai-field-core';
import { ImageContainer } from '../../../services/imagestore/image-container';
import { ImageUrlMaker } from '../../../services/imagestore/image-url-maker';
import { showMissingImageMessageOnConsole, showMissingOriginalImageMessageOnConsole } from '../log-messages';
import { Messages } from '../../messages/messages';
import { M } from '../../messages/m';
import { Loading } from '../../widgets/loading';


@Component({
    selector: 'image-viewer',
    templateUrl: './image-viewer.html'
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ImageViewerComponent implements OnChanges {

    @Input() image: ImageDocument;

    public imageContainer: ImageContainer;
    public loadingIconVisible: boolean = false;
    public loadingIconTimeout: any = undefined;


    constructor(private imageUrlMaker: ImageUrlMaker,
                private imagestore: ImageStore,
                private messages: Messages,
                private loading: Loading,
                private zone: NgZone,
                private changeDetectorRef: ChangeDetectorRef) {}


    async ngOnChanges() {

        if (!this.imagestore.getAbsoluteRootPath()) {
            this.messages.add([M.IMAGESTORE_ERROR_INVALID_PATH_READ]);
        }
        
        if (this.image) await this.update();
    }


    public containsOriginal(imageContainer: ImageContainer): boolean {

        return imageContainer.imgSrc !== undefined && imageContainer.imgSrc !== '';
    }


    public isImageContainerVisible(): boolean {
        
        return !this.loadingIconVisible
            || this.image.resource.id === this.imageContainer.document.resource.id;
    }


    public stopLoading() {

        if (this.loadingIconTimeout) {
            clearTimeout(this.loadingIconTimeout);
            this.loadingIconTimeout = undefined;
        }
        this.loading.stop('image-viewer', false);
        this.loadingIconVisible = false;
    }


    private async update() {

        this.stopLoading();

        if (this.image.resource.id === this.imageContainer?.document.resource.id) return;
        
        this.zone.run(async () => {
            const newImageContainer: ImageContainer = await this.loadImage(this.image);
            if (newImageContainer.document.resource.id === this.image.resource.id) {
                this.imageContainer = newImageContainer;
            }
        });
    }


    private async loadImage(document: ImageDocument): Promise<ImageContainer> {

        this.startLoading();
        this.changeDetectorRef.detectChanges();

        const image: ImageContainer = { document };

        try {
            image.imgSrc = await this.imageUrlMaker.getUrl(document.resource.id, ImageVariant.DISPLAY);
            this.changeDetectorRef.detectChanges();
        } catch (e) {
            image.imgSrc = undefined;
            image.thumbSrc = await this.imageUrlMaker.getUrl(document.resource.id, ImageVariant.THUMBNAIL);
            this.stopLoading();
        }

        this.showConsoleErrorIfImageIsMissing(image);

        return image;
    }


    private startLoading() {

        this.loading.start('image-viewer', false);

        this.loadingIconTimeout = setTimeout(() => {
            this.loadingIconVisible = true;
        }, 250);
    }


    private showConsoleErrorIfImageIsMissing(image: ImageContainer) {

        if (this.containsOriginal(image)) return;

        const imageId: string = image.document && image.document.resource
            ? image.document.resource.id
            : 'unknown';

        if (image.thumbSrc === ImageUrlMaker.blackImg) {
            showMissingImageMessageOnConsole(imageId);
        } else {
            showMissingOriginalImageMessageOnConsole(imageId);
        }
    }
}
