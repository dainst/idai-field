import {M} from "../m";
import {ReadMediastore} from "idai-components-2/datastore";
import {DomSanitizer} from "@angular/platform-browser";
import {IdaiFieldDocument} from "../model/idai-field-document";

export interface ImageContainer {
    imgSrc? : string;
    calculatedWidth? : number;
    calculatedHeight? : number;
    document? : IdaiFieldDocument;
}

/**
 * This tool is used to get binary data from a mediastore and put them as blobs into html img tags.
 *
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class BlobProxy {

    private blackImg = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';

    constructor(
        private mediastore: ReadMediastore,
        private sanitizer: DomSanitizer
    ) { }

    /**
     * @param identifier
     * @return {Promise<Array<string>>} where the string array is a <code>msgWithParams</code> ({@link Messages#addWithParams}).
     */
    public urlForImage(identifier): Promise<Array<string>> {
        return new Promise((resolve, reject) => {
            this.mediastore.read(identifier).then(data => {
                var url = URL.createObjectURL(new Blob([data]));
                resolve(this.sanitizer.bypassSecurityTrustResourceUrl(url));
            }).catch(error => {
                reject([M.IMAGES_ERROR_MEDIASTORE_READ].concat([identifier]));
                reject(error);
            });
        });
    }

    /**
     * Fills the <code>imgSrc</code> of the <code>imageContainer</code> with blob data extracted from
     * the file associated to the containers resource.
     *
     * @param <code>imageContainer</code>
     *   <code>imgContainer.document.resource['filename']</code>
     *   must be a filename of an existing file in the mediastore.
     *
     * @return {Promise<Array<string>>} where the string array is a <code>msgWithParams</code> ({@link Messages#addWithParams}).
     */
    public setImgSrc(imageContainer : ImageContainer) : Promise<Array<string>>{

        return new Promise((resolve, reject) => {
            var image:ImageContainer = imageContainer;

            var callback = image => {
                return url => {
                    image.imgSrc = url;
                    resolve();
                }
            };
            var errorCallback = image => {
                return errors => {
                    // display a black image
                    image.imgSrc = this.blackImg;
                    reject(errors)
                }
            };
            this.urlForImage(imageContainer.document.resource.identifier)
                .then(callback(image))
                .catch(errorCallback(image));
        });
    }
}