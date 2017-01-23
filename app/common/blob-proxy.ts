import {M} from "../m";
import {ReadMediastore} from "idai-components-2/datastore";
import {DomSanitizer} from "@angular/platform-browser";
import {IdaiFieldImageDocument} from "../model/idai-field-image-document";

export interface ImageContainer {
    imgSrc? : string;
    calculatedWidth? : number;
    calculatedHeight? : number;
    document? : IdaiFieldImageDocument;
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
     * Generate a blob url for an Image given its identifier
     * @param identifier
     * @return {Promise<string>} A promise returning the url
     */
    public urlForImage(identifier): Promise<string> {
        return new Promise((resolve, reject) => {
            this.mediastore.read(identifier).then(data => {

                if (data == undefined) return resolve(this.blackImg)

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
     * @return {Promise<ImageContainer>} Promise that returns the given
     *  <code>imageContainer</code> with <code>imgSrc</code> set.
     *  In case of error the imgSrc is set to a data url that represents a black img.
     */
    public setImgSrc(imageContainer : ImageContainer) : Promise<ImageContainer>{

        return new Promise((resolve, reject) => {
            var image:ImageContainer = imageContainer;

            var callback = image => {
                return url => {
                    image.imgSrc = url;
                    resolve(image);
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