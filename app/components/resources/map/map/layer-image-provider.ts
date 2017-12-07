import {Injectable} from '@angular/core';
import {ImageContainer} from '../../../../core/imagestore/image-container';
import {Imagestore} from '../../../../core/imagestore/imagestore';
import {BlobMaker} from '../../../../core/imagestore/blob-maker';


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
            // TODO check if thumbnail
            this.imagestore.revoke(resourceId, false);
        }

        this.imageContainers = {};
    }


    private createImageContainer(resourceId: string): Promise<ImageContainer> {

        return this.imagestore.read(resourceId, true, false)
            .then(url => {
                if (url != '') {
                    return Promise.resolve({ imgSrc: url });
                } else {
                    this.imagestore.read(resourceId, true, true).then(thumbnailUrl => {
                        // TODO Save this in imgContainer.thumbSrc?
                        return Promise.resolve({ imgSrc: thumbnailUrl });
                    }).catch(() => {
                        return Promise.resolve({ imgSrc: BlobMaker.blackImg });
                    });
                }
            }, () => {
                console.error('Error while creating image container. Original image not found in imagestore for ' +
                    'document:', document);
                return Promise.resolve({ imgSrc: BlobMaker.blackImg });
            });
    }
}