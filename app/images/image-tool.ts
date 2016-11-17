import {Messages} from "idai-components-2/messages";
import {Document} from "idai-components-2/core";
import {M} from "../m";
import {Mediastore} from "../datastore/mediastore";
import {DomSanitizer} from "@angular/platform-browser";

export interface ImageContainer {
    imgSrc? : string;
    calculatedWidth? : number;
    calculatedHeight? : number;
    document? : Document;
}

/**
 * @author Sebastian Cuy
 * @autor Daniel de Oliveira
 */
export class ImageTool {

    constructor(
        private mediastore: Mediastore,
        private sanitizer: DomSanitizer,
        private messages: Messages
    ) { }

    private urlForImage(filename): Promise<string> {
        return new Promise((resolve, reject) => {
            this.mediastore.read(filename).then(data => {
                var url = URL.createObjectURL(new Blob([data]));
                resolve(this.sanitizer.bypassSecurityTrustResourceUrl(url));
            }).catch(error => {
                this.messages.add(M.IMAGES_ERROR_MEDIASTORE_READ, [filename]);
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

        var callback = image => { return url => image['imgSrc'] = url };
        var errorCallback = image => { return url =>
            // display a black image
            image.imgSrc = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
        };
        this.urlForImage(imageContainer.document.resource['filename'])
            .then(callback(image))
            .catch(errorCallback(image));
    }
}