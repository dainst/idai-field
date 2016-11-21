import {Messages} from "idai-components-2/messages";
import {M} from "../m";
import {ReadMediastore} from "../datastore/read-mediastore";
import {DomSanitizer} from "@angular/platform-browser";
import {IdaiFieldDocument} from "../model/idai-field-document";

export interface ImageContainer {
    imgSrc? : string;
    calculatedWidth? : number;
    calculatedHeight? : number;
    document? : IdaiFieldDocument;
}

/**
 * @author Sebastian Cuy
 * @autor Daniel de Oliveira
 */
export class BlobProxy {

    private imgSrc = 'imgSrc';
    private blackImg = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';

    constructor(
        private mediastore: ReadMediastore,
        private sanitizer: DomSanitizer,
        private messages: Messages
    ) { }

    private urlForImage(identifier): Promise<string> {
        return new Promise((resolve, reject) => {
            this.mediastore.read(identifier).then(data => {
                var url = URL.createObjectURL(new Blob([data]));
                resolve(this.sanitizer.bypassSecurityTrustResourceUrl(url));
            }).catch(error => {
                this.messages.add(M.IMAGES_ERROR_MEDIASTORE_READ, [identifier]);
                console.error(error);
                reject(error);
            });
        });
    }

    /**
     * @param imageContainer
     *   imgCell.document.resource['filename'] must be a filename of an existing file in the mediastore.
     */
    public setImgSrc(imageContainer : ImageContainer) {
        var image : ImageContainer = imageContainer;

        var callback = image => { return url => image[this.imgSrc] = url };
        var errorCallback = image => { return url =>
            // display a black image
            image.imgSrc = this.blackImg;
        };
        this.urlForImage(imageContainer.document.resource.identifier)
            .then(callback(image))
            .catch(errorCallback(image));
    }
}