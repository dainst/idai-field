import { Component, OnChanges, Input, NgZone } from '@angular/core';
import { ImageDocument, ImageStore, ImageVariant } from 'idai-field-core';
import { ImageContainer } from '../../../services/imagestore/image-container';
import { ImageUrlMaker } from '../../../services/imagestore/image-url-maker';
import { showMissingImageMessageOnConsole, showMissingOriginalImageMessageOnConsole } from '../log-messages';
import { Messages } from '../../messages/messages';
import { M } from '../../messages/m';
import { Loading } from '../../widgets/loading';
import { AngularUtility } from '../../../angular/angular-utility';


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
                private messages: Messages,
                private loading: Loading,
                private zone: NgZone) {}


    async ngOnChanges() {

        if (!this.imagestore.getAbsoluteRootPath()) {
            this.messages.add([M.IMAGESTORE_ERROR_INVALID_PATH_READ]);
        }
        
        if (this.image) await this.update();
    }


    public containsOriginal(image: ImageContainer): boolean {

        return image.imgSrc !== undefined && image.imgSrc !== '';
    }


    public onLoadingFinished() {

        this.loading.stop('image-viewer', false);
    }


    private async update() {

        this.loading.stop('image-viewer', false);

        this.imageContainer = { document: this.image, imgSrc: ImageUrlMaker.blackImg };
        await AngularUtility.refresh();

        this.zone.run(async () => {
            const newImageContainer: ImageContainer = await this.loadImage(this.image);
            if (newImageContainer.document.resource.id === this.image.resource.id) {
                this.imageContainer = newImageContainer;
            }
        });
    }


    private async loadImage(document: ImageDocument): Promise<ImageContainer> {

        this.loading.start('image-viewer', false);

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
