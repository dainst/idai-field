import {Injectable, SecurityContext} from '@angular/core';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {Imagestore, IMAGEVERSION} from '../../../../../services/imagestore/imagestore';
import {ImageContainer} from '../../../../../services/imagestore/image-container';
import {BlobMaker} from '../../../../../services/imagestore/blob-maker';

@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class LayerImageProvider {

    private imageContainers: { [resourceId: string]: ImageContainer } = {};


    constructor(private imagestore: Imagestore, private sanitizer: DomSanitizer) {}


    public async getImageContainer(resourceId: string): Promise<ImageContainer> {

        if (!this.imageContainers[resourceId]) {
            this.imageContainers[resourceId] = await this.createImageContainer(resourceId);
        }

        return this.imageContainers[resourceId];
    }

    public reset() {
        this.imagestore.revokeAllUrls();
        this.imageContainers = {};
    }


    private async createImageContainer(resourceId: string): Promise<ImageContainer> {

        let url: string|SafeResourceUrl;
        try {
            url = this.sanitizer.sanitize(
                SecurityContext.RESOURCE_URL, await this.imagestore.getUrl(resourceId, IMAGEVERSION.ORIGINAL)
            );
        } catch (err) {
            console.error(err);
            console.error('Error while creating image container. Original image not found in imagestore ' +
                'for document:', document);
            return { imgSrc: BlobMaker.blackImg };
        }

        if (url !== '') {
            return { imgSrc: url };
        } else {
            try {
                return {
                    thumbSrc: this.sanitizer.sanitize(
                        SecurityContext.RESOURCE_URL, await this.imagestore.getUrl(resourceId, IMAGEVERSION.THUMBNAIL)
                    )
                };
            } catch (err) {
                return { imgSrc: BlobMaker.blackImg };
            }
        }
    }
}
