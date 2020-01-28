import {ImageDocument} from 'idai-components-2';
import {ImageWidthCalculator} from './image-width-calculator';


/**
 * @author Thomas Kleinke
 */
export class ImageRow {

    private firstShownImageIndex: number = -1;
    private lastShownImageIndex: number = -1;


    constructor(private width: number,
                private height: number,
                private maxImageWidth: number,
                private images: Array<ImageDocument>) {}


    public nextPage(): string[] {

        if (this.images.length === 0) return [];

        this.firstShownImageIndex = this.lastShownImageIndex + 1;
        this.calculateLastShownImageIndex();

        return this.getIdsOfShownImages();
    }


    private calculateLastShownImageIndex() {

        this.lastShownImageIndex = this.firstShownImageIndex;

        let availableWidth: number = this.width;

        for (let i = this.firstShownImageIndex; i < this.images.length; i++) {
            availableWidth -= ImageWidthCalculator.computeWidth(
                this.images[i].resource.width, this.images[i].resource.height, this.height, this.maxImageWidth
            );

            if (availableWidth < 0) break;

            this.lastShownImageIndex = i;
        }
    }


    private getIdsOfShownImages(): string[] {

        return this.images.slice(this.firstShownImageIndex, this.lastShownImageIndex + 1)
            .map(image => image.resource.id);
    }
}