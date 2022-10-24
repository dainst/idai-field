import { Injectable, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ImageVariant } from 'idai-field-core';
import { ImageUrlMaker } from '../../../../../services/imagestore/image-url-maker';
import { ImageContainer } from '../../../../../services/imagestore/image-container';


@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class LayerImageProvider {

    private imageContainers: { [resourceId: string]: ImageContainer } = {};


    constructor(private imageUrlMaker: ImageUrlMaker,
                private sanitizer: DomSanitizer) {}


    public async getImageContainer(resourceId: string): Promise<ImageContainer> {

        if (!this.imageContainers[resourceId]) {
            this.imageContainers[resourceId] = await this.createImageContainer(resourceId);
        }

        return this.imageContainers[resourceId];
    }


    public reset() {

        this.imageUrlMaker.revokeAllUrls();
        this.imageContainers = {};
    }


    private async createImageContainer(resourceId: string): Promise<ImageContainer> {

        let url: string|SafeResourceUrl;
        try {
            url = this.sanitizer.sanitize(
                SecurityContext.RESOURCE_URL, await this.imageUrlMaker.getUrl(resourceId, ImageVariant.ORIGINAL)
            );
            return { imgSrc: url };
        } catch (err) {
            try {
                url = this.sanitizer.sanitize(
                    SecurityContext.RESOURCE_URL, await this.imageUrlMaker.getUrl(resourceId, ImageVariant.THUMBNAIL)
                );
                return { imgSrc: url };
            } catch (err) {
                return { imgSrc: ImageUrlMaker.blackImg };
            }
        }
    }
}
