import {Injectable} from '@angular/core';
import {SafeResourceUrl} from '@angular/platform-browser';
import {Imagestore} from '../../../../../core/images/imagestore/imagestore';
import {ImageContainer} from '../../../../../core/images/imagestore/image-container';
import {BlobMaker} from '../../../../../core/images/imagestore/blob-maker';


@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class LayerImageProvider {

    private imageContainers: { [resourceId: string]: ImageContainer } = {};


    constructor(private imagestore: Imagestore) {}


    public async getImageContainer(resourceId: string): Promise<ImageContainer> {

        if (!this.imageContainers[resourceId]) {
            this.imageContainers[resourceId] = await this.createImageContainer(resourceId);
        }

        return this.imageContainers[resourceId];
    }


    public reset() {

        for (let resourceId of Object.keys(this.imageContainers)) {
            const thumb: boolean = !this.imageContainers[resourceId].imgSrc;
            this.imagestore.revoke(resourceId, thumb);
        }

        this.imageContainers = {};
    }


    private async createImageContainer(resourceId: string): Promise<ImageContainer> {

        let url: string|SafeResourceUrl;
        try {
            url = await this.imagestore.read(resourceId, true, false);
        } catch (err) {
            console.error('Error while creating image container. Original image not found in imagestore ' +
                'for document:', document);
            return { imgSrc: BlobMaker.blackImg };
        }

        if (url !== '') {
            return { imgSrc: url };
        } else {
            try {
                return { thumbSrc: await this.imagestore.read(resourceId, true, true) };
            } catch (err) {
                return { imgSrc: BlobMaker.blackImg };
            }
        }
    }
}