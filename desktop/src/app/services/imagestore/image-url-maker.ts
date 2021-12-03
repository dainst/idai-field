import {Injectable, SecurityContext} from '@angular/core';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {Imagestore, IMAGEVERSION} from './imagestore';

@Injectable()
/**
 * Provides URLs for binary data read from the {@link ImageStore} for
 * usage in the Angular application.
 *
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Simon Hohl
 */
export class ImageUrlMaker {

    public static blackImg = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';

    private originalUrls: { [imageKey: string]: SafeResourceUrl} = {};
    private thumbnailUrls: { [imageKey: string]: SafeResourceUrl} = {};

    constructor(private sanitizer: DomSanitizer, private imagestore: Imagestore) {}

    /**
     * Returns a URL to the image for the requested image resource.
     *
     * Internally creates a link to in-memory image data using {@link URL.createObjectURL}, you may want to call
     * {@link revokeImageUrl} or {@link revokeAllImageUrls} prematurely if you run into memory issues.
     * See also https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL.
     *
     * @param imageId the image's id
     * @param type the image's version, for possible values see {@link IMAGEVERSION}
     */
     public async getUrl(imageId: string, type: IMAGEVERSION): Promise<SafeResourceUrl> {

        const relevantList = (type === IMAGEVERSION.ORIGINAL) ? this.originalUrls : this.thumbnailUrls;

        if (relevantList[imageId]) {
            return relevantList[imageId];
        }
        const data = await this.imagestore.getData(imageId, type);

        relevantList[imageId] = this.sanitizer.bypassSecurityTrustResourceUrl(
            URL.createObjectURL(new Blob([data]))
        );

        return relevantList[imageId];
    }


    /**
     * Forces a revokation of all URLs objects created by {@link getUrl}, freeing the linked binary data
     * up for garbage collection.
     */
     public revokeAllUrls() {

        for (const imageId of Object.keys(this.originalUrls)) {
            this.revokeUrl(imageId, IMAGEVERSION.ORIGINAL);
        }

        for (const imageId of Object.keys(this.originalUrls)) {
            this.revokeUrl(imageId, IMAGEVERSION.THUMBNAIL);
        }
    }

     private revokeUrl(imageId: string, type: IMAGEVERSION) {

        const requestedList = (type === IMAGEVERSION.ORIGINAL) ? this.originalUrls : this.thumbnailUrls;
        if (!requestedList[imageId]) return;

        URL.revokeObjectURL(this.sanitizer.sanitize(SecurityContext.RESOURCE_URL, requestedList[imageId]));
        delete requestedList[imageId];
    }
}
