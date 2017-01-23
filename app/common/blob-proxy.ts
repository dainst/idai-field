import {M} from "../m";
import {ReadMediastore} from "idai-components-2/datastore";
import {DomSanitizer} from "@angular/platform-browser";
import {IdaiFieldImageDocument} from "../model/idai-field-image-document";
import {SecurityContext} from "@angular/core";

export interface ImageContainer {
    imgSrc? : string;
    document? : IdaiFieldImageDocument;

    // used by ImagesGridComponent
    calculatedWidth? : number;
    calculatedHeight? : number;

    // used by MapComponent
    zIndex? : number;
    object?: L.ImageOverlay;
}

/**
 * This tool is used to get binary data from a
 * mediastore and put them as blobs into html img tags.
 *
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class BlobProxy {

    private blackImg = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';

    constructor(
        private mediastore: ReadMediastore,
        private sanitizer: DomSanitizer
    ) { }



    /**
     * Generate a blob url for an Image given its identifier
     * @param identifier
     * @return {Promise<string>} A promise returning the url
     */
    private urlForImage(identifier): Promise<string> {
        return new Promise((resolve, reject) => {
            this.mediastore.read(identifier).then(data => {

                if (data == undefined) return resolve(this.blackImg);

                var url = URL.createObjectURL(new Blob([data]));
                resolve(this.sanitizer.bypassSecurityTrustResourceUrl(url));

            }).catch(error => {
                reject([M.IMAGES_ERROR_MEDIASTORE_READ].concat([identifier]));
            });
        });
    }

    /**
     * Fills the <code>imgSrc</code> of the <code>imageContainer</code> with a blob url generated from
     * the file associated to the containers resource.
     *
     * @param <code>imageContainer</code>
     *   <code>imgContainer.document.resource.identifier</code>
     *   must be an identifier of an existing file in the mediastore.
     *
     * @return {Promise<ImageContainer|Array<string>} Promise that returns the given
     *    <code>imageContainer</code> with <code>imgSrc</code> set.
     *  In case of error the imgSrc is set to a data url that represents a black img
     *    and the promise gets rejected with an array of error msgs.
     */
    public setImgSrc(imageContainer : ImageContainer,sanitizeAfter:boolean = false) : Promise<ImageContainer>{

        return new Promise((resolve, reject) => {
            var image:ImageContainer = imageContainer;

            var callback = image => {
                return url => {
                    if (sanitizeAfter) {
                        image.imgSrc = this.sanitizer.sanitize(SecurityContext.RESOURCE_URL, url)
                    } else {
                        image.imgSrc = url;
                    }
                    resolve(image); // TODO since there are side effects anyway, don't return the imageContainer here
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