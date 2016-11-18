import {Messages} from "idai-components-2/messages";
import {Datastore} from 'idai-components-2/datastore';
import {M} from "../m";
import {Mediastore} from "../datastore/mediastore";
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
export class ImageTool {

    constructor(
        private datastore: Datastore,
        private mediastore: Mediastore,
        private sanitizer: DomSanitizer,
        private messages: Messages
    ) { }

    public urlForImage(identifier): Promise<string> {
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

        var callback = image => { return url => image['imgSrc'] = url };
        var errorCallback = image => { return url =>
            // display a black image
            image.imgSrc = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
        };
        this.urlForImage(imageContainer.document.resource.identifier)
            .then(callback(image))
            .catch(errorCallback(image));
    }

    public delete(document): Promise<any> {
        return new Promise((resolve) => {
            this.mediastore.remove(document.resource.identifier).then(() => {
                this.datastore.remove(document.id).then(() => resolve()).catch(err => {
                    this.messages.add(M.IMAGES_ERROR_DELETE, [document.resource.identifier]);
                    console.log(err);
                });
            }).catch(err => {
                this.messages.add(M.IMAGES_ERROR_DELETE, [document.resource.identifier]);
                console.log(err);
            });
        });
    }
}