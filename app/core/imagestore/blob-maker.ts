import {Injectable, SecurityContext} from '@angular/core';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';

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


    public makeBlob(data: any): any {

        const url = URL.createObjectURL(new Blob([data]));
        const safeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);

        return {
            url: url,
            safeResourceUrl: safeResourceUrl,
            sanitizedSafeResourceUrl: this.sanitizer.sanitize(SecurityContext.RESOURCE_URL, safeResourceUrl) as string
        };
    }


    public static revokeBlob(revokeUrl: string) {

        URL.revokeObjectURL(revokeUrl);
    }
}


export interface BlobUrlSet {

    url: string;
    safeResourceUrl: SafeResourceUrl;
    sanitizedSafeResourceUrl: string;
}