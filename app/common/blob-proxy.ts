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
     * Loads an image from the mediastore and returns an url through which it is accessible.
     * @param mediastoreFilename must be an identifier of an existing file in the mediastore.
     *
     * @return {Promise<string>} Promise that returns the blob url.
     *  In case of error the promise gets rejected with msgWithParams.
     */
    public getBlobUrl(mediastoreFilename:string,sanitizeAfter:boolean = false) : Promise<string> {

        return new Promise((resolve, reject) => {
            var callback = () => {
                return url => {
                    var imgSrc;
                    if (sanitizeAfter) {
                        imgSrc = this.sanitizer.sanitize(SecurityContext.RESOURCE_URL, url)
                    } else {
                        imgSrc = url;
                    }
                    resolve(imgSrc);
                }
            };
            var errorCallback = () => {
                return msgWithParams => {
                    // TODO see if this is still needed and where it can be applied
                    // display a black image
                    // image.imgSrc = this.blackImg;
                    reject(msgWithParams)
                }
            };
            this.urlForImage(mediastoreFilename)
                .then(callback())
                .catch(errorCallback());
        });
    }
}