import {M} from "../m";
import {ReadImagestore} from "./read-imagestore";
import {DomSanitizer} from "@angular/platform-browser";
import {SecurityContext} from "@angular/core";


/**
 * This tool is used to get binary data from a
 * mediastore and put them as blobs into html img tags.
 *
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class BlobProxy {

    public static blackImg = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';

    constructor(
        private imagestore: ReadImagestore,
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
            this.imagestore.read(mediastoreFilename).then(data => {
                if (data == undefined) reject([M.IMAGES_ERROR_MEDIASTORE_READ].concat([mediastoreFilename]));
                resolve(this.makeBlob(data,sanitizeAfter));
            }).catch(() => {
                reject([M.IMAGES_ERROR_MEDIASTORE_READ].concat([mediastoreFilename]));
            });
        });
    }

    private makeBlob(data,sanitizeAfter) {
        var url = URL.createObjectURL(new Blob([data]));
        var safeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        if (sanitizeAfter) {
            return this.sanitizer.sanitize(SecurityContext.RESOURCE_URL, safeResourceUrl);
        } else {
            return safeResourceUrl;
        }
    }
}