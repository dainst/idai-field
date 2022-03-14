import {Injectable, SecurityContext} from '@angular/core';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {ImageVariant} from 'idai-field-core';
import {ImageContainer} from '../../../../../services/imagestore/image-container';
import {ImageUrlMaker} from '../../../../../services/imagestore/image-url-maker';

@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class LayerImageProvider {

    private imageContainers: { [resourceId: string]: ImageContainer } = {};


    constructor(private imageUrlMaker: ImageUrlMaker, private sanitizer: DomSanitizer) {}


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
            console.error(err);
            console.error('Error while creating image container. Original image not found in imagestore ' +
                'for document:', document);

            try {
                url =  this.sanitizer.sanitize(
                    SecurityContext.RESOURCE_URL, await this.imageUrlMaker.getUrl(resourceId, ImageVariant.THUMBNAIL)
                );
                return { imgSrc: url };
            } catch (err) {

                console.error('Error while creating fallback image container. Thumbnail image also not found in imagestore ' +
                    'for document:', document);
                return { imgSrc: ImageUrlMaker.blackImg };
            }
        }
    }
}
