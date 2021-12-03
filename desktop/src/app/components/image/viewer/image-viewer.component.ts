import {Component, OnChanges, Input, OnInit} from '@angular/core';
import {ImageDocument} from 'idai-field-core';
import {ImageContainer} from '../../../services/imagestore/image-container';
import {ImageUrlMaker} from '../../../services/imagestore/image-url-maker';
import {showMissingImageMessageOnConsole, showMissingOriginalImageMessageOnConsole} from '../log-messages';
import {M} from '../../messages/m';
import {Imagestore, IMAGEVERSION} from '../../../services/imagestore/imagestore';
import {Messages} from '../../messages/messages';


@Component({
    selector: 'image-viewer',
    templateUrl: './image-viewer.html'
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ImageViewerComponent implements /* OnInit,*/ OnChanges {

    @Input() image: ImageDocument;

    public imageContainer: ImageContainer;


    constructor(
        private imageUrlMaker: ImageUrlMaker,
        private messages: Messages
    ) {}


    // TODO: Was wird hier genau gecheckt? Ob die Ordner bereist angelegt wurden? Das sollte der ImageStore eigentlich selber machen.
    // ngOnInit() {

    //     if (!this.imageStore.getPath()) this.messages.add([M.IMAGESTORE_ERROR_INVALID_PATH_READ]);
    // }


    async ngOnChanges() {

        if (this.image) this.imageContainer = await this.loadImage(this.image);
    }


    public containsOriginal(image: ImageContainer): boolean {

        return image.imgSrc !== undefined && image.imgSrc !== '';
    }


    private async loadImage(document: ImageDocument): Promise<ImageContainer> {

        const image: ImageContainer = { document: document };

        try {
            image.imgSrc = await this.imageUrlMaker.getUrl(document.resource.id, IMAGEVERSION.ORIGINAL);
        } catch (e) {
            image.imgSrc = ImageUrlMaker.blackImg;
        }

        try {
            image.thumbSrc = await this.imageUrlMaker.getUrl(document.resource.id, IMAGEVERSION.THUMBNAIL);
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
