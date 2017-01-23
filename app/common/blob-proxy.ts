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

    // TODO see if this is still needed and where it can be applied
    private blackImg = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';

    constructor(
        private mediastore: ReadMediastore,
        private sanitizer: DomSanitizer
    ) { }

    /**
     * Loads an image from the mediastore and generates a blob. Returns an url through which it is accessible.
     * @param mediastoreFilename must be an identifier of an existing file in the mediastore.
     * @param sanitizeAfter
     * @return {Promise<string>} Promise that returns the blob url.
     *  In case of error the promise gets rejected with msgWithParams.
     */
    public getBlobUrl(mediastoreFilename:string,sanitizeAfter:boolean = false): Promise<string> {
        return new Promise((resolve, reject) => {
            // TODO catch errors
            this.mediastore.read(mediastoreFilename).then(data => {

                if (data == undefined) return resolve(this.blackImg);

                var url = URL.createObjectURL(new Blob([data]));
                var safeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
                if (sanitizeAfter) {
                    resolve(this.sanitizer.sanitize(SecurityContext.RESOURCE_URL, safeResourceUrl));
                } else {
                    resolve(safeResourceUrl);
                }

            }).catch(() => {
                reject([M.IMAGES_ERROR_MEDIASTORE_READ].concat([mediastoreFilename]));
            });
        });
    }
}