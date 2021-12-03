import {Injectable, SecurityContext} from '@angular/core';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {Imagestore, IMAGEVERSION} from './imagestore';

@Injectable()
/**
 * This tool is used to get binary data from a
 * mediastore and put them as blobs into html img tags.
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
     * Returns a URL for the image for the requested image resource. Actually creates a link to in memory
     * image data using {@link URL.createObjectURL}, you may want to call {@link revokeImageUrl} or {@link revokeAllImageUrls}
     * prematurely if you run into memory issues. See also https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL.
     * @param imageId the image's id
     * @param type the imageversion, for possible values see {@link IMAGEVERSION}
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
     * Calls {@link revokeUrl} for all images in the datastore.
     */
     public revokeAllUrls() {

        for (const imageId of Object.keys(this.originalUrls)) {
            this.revokeUrl(imageId, IMAGEVERSION.ORIGINAL);
        }

        for (const imageId of Object.keys(this.originalUrls)) {
            this.revokeUrl(imageId, IMAGEVERSION.THUMBNAIL);
        }
    }

    /**
     * Revokes the object URLs for an image created by {@link getUrl}.
     * @param imageId the image's id
     */
     private revokeUrl(imageId: string, type: IMAGEVERSION) {

        const requestedList = (type === IMAGEVERSION.ORIGINAL) ? this.originalUrls : this.thumbnailUrls;
        if (!requestedList[imageId]) return;

        URL.revokeObjectURL(this.sanitizer.sanitize(SecurityContext.RESOURCE_URL, requestedList[imageId]));
        delete requestedList[imageId];
    }
}
