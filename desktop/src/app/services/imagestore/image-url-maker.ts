import { Injectable, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Datastore, ImageDocument, ImageStore, ImageVariant } from 'idai-field-core';
import { createDisplayVariant } from './create-display-variant';


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

    private displayUrls: { [imageKey: string]: SafeResourceUrl} = {};
    private thumbnailUrls: { [imageKey: string]: SafeResourceUrl} = {};


    constructor(private sanitizer: DomSanitizer,
                private imagestore: ImageStore,
                private datastore: Datastore) {}


    /**
     * Returns a URL to the image for the requested image resource.
     *
     * Internally creates a link to in-memory image data using {@link URL.createObjectURL}, you may want to call
     * {@link revokeImageUrl} or {@link revokeAllImageUrls} prematurely if you run into memory issues.
     * See also https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL.
     *
     * @param imageId the image's id
     * @param variant the image's version, for possible values see {@link ImageVariant}
     */
     public async getUrl(imageId: string, variant: ImageVariant): Promise<SafeResourceUrl> {

        const relevantList = (variant === ImageVariant.DISPLAY) ? this.displayUrls : this.thumbnailUrls;

        if (relevantList[imageId]) return relevantList[imageId];

        const displayData: Buffer|undefined = await this.fetchDisplayData(imageId, variant);
        if (!displayData) return ImageUrlMaker.blackImg;

        relevantList[imageId] = this.sanitizer.bypassSecurityTrustResourceUrl(
            URL.createObjectURL(new Blob([displayData]))
        );

        return relevantList[imageId];
    }


    /**
     * Forces a revokation of all URLs objects created by {@link getUrl}, freeing the linked binary data
     * up for garbage collection.
     */
    public revokeAllUrls() {

        for (const imageId of Object.keys(this.displayUrls)) {
            this.revokeUrl(imageId, ImageVariant.DISPLAY);
        }

        for (const imageId of Object.keys(this.displayUrls)) {
            this.revokeUrl(imageId, ImageVariant.THUMBNAIL);
        }
    }


    private revokeUrl(imageId: string, type: ImageVariant) {

        const requestedList = (type === ImageVariant.DISPLAY) ? this.displayUrls : this.thumbnailUrls;
        if (!requestedList[imageId]) return;

        URL.revokeObjectURL(this.sanitizer.sanitize(SecurityContext.RESOURCE_URL, requestedList[imageId]));
        delete requestedList[imageId];
    }


    private async fetchDisplayData(imageId: string, variant: ImageVariant): Promise<Buffer|undefined> {

        try {
            return await this.imagestore.getData(imageId, variant);
        } catch (err) {
            if (variant === ImageVariant.DISPLAY) {
                return this.fetchDisplayDataFromOriginal(imageId);
            } else {
                return undefined;
            }
        }
    }


    private async fetchDisplayDataFromOriginal(imageId: string): Promise<Buffer|undefined> {

        let data: Buffer;
        try {
            data = await this.imagestore.getData(imageId, ImageVariant.ORIGINAL);
        } catch (err) {
            return undefined;
        }

        const document: ImageDocument = await this.datastore.get(imageId) as ImageDocument;
        const displayData: Buffer = await createDisplayVariant(document, this.imagestore, data);

        return displayData ?? data;
    }
}
