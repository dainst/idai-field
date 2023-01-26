import { Component, OnChanges, Input } from '@angular/core';
import { ImageDocument, ImageStore, ImageVariant } from 'idai-field-core';
import { ImageContainer } from '../../../services/imagestore/image-container';
import { ImageUrlMaker } from '../../../services/imagestore/image-url-maker';
import { showMissingImageMessageOnConsole, showMissingOriginalImageMessageOnConsole } from '../log-messages';
import { Messages } from '../../messages/messages';
import { M } from '../../messages/m';


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


    constructor(private imageUrlMaker: ImageUrlMaker,
                private imagestore: ImageStore,
                private messages: Messages) {}


    async ngOnChanges() {

        if (!this.imagestore.getAbsoluteRootPath()) {
            this.messages.add([M.IMAGESTORE_ERROR_INVALID_PATH_READ]);
        }
        
        if (this.image) this.imageContainer = await this.loadImage(this.image);
    }


    public containsOriginal(image: ImageContainer): boolean {

        return image.imgSrc !== undefined && image.imgSrc !== '';
    }


    private async loadImage(document: ImageDocument): Promise<ImageContainer> {

        const image: ImageContainer = { document };

        try {
            image.imgSrc = await this.imageUrlMaker.getUrl(document.resource.id, ImageVariant.ORIGINAL);
        } catch (e) {
            image.imgSrc = undefined;
        }

        try {
            image.thumbSrc = await this.imageUrlMaker.getUrl(document.resource.id, ImageVariant.THUMBNAIL);
        } catch (e) {
            image.thumbSrc = ImageUrlMaker.blackImg;
        }

        this.showConsoleErrorIfImageIsMissing(image);

        return image;
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
