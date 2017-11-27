import {Injectable, SecurityContext} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';

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


    constructor(private sanitizer: DomSanitizer) {};


    public makeBlob(data: any, sanitizeAfter: boolean): any {

        const url = URL.createObjectURL(new Blob([data]));
        const safeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);

        if (sanitizeAfter) {
            return { url: this.sanitizer.sanitize(SecurityContext.RESOURCE_URL, safeResourceUrl), revokeUrl: url };
        } else {
            return { url: safeResourceUrl, revokeUrl: url };
        }
    }


    public static revokeBlob(revokeUrl: string) {

        URL.revokeObjectURL(revokeUrl);
    }
}


export interface BlobMakerResult {

    url: string;
    revokeUrl: string;
}