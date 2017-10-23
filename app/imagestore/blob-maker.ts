import {Injectable} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {SecurityContext} from '@angular/core';

@Injectable()
/**
 * This tool is used to get binary data from a
 * mediastore and put them as blobs into html img tags.
 *
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class BlobMaker {

    public static blackImg = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';

    constructor(private sanitizer:DomSanitizer) { };


    public makeBlob(data: any, sanitizeAfter: any) {

        const url = URL.createObjectURL(new Blob([data]));
        const safeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        if (sanitizeAfter) {
            return this.sanitizer.sanitize(SecurityContext.RESOURCE_URL, safeResourceUrl);
        } else {
            return safeResourceUrl;
        }
    }
}