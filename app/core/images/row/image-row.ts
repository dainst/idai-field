import {ImageDocument} from 'idai-components-2';
import {ImageWidthCalculator} from './image-width-calculator';


/**
 * @author Thomas Kleinke
 */
export class ImageRow {

    private firstShownImageIndex: number = -1;
    private lastShownImageIndex: number = -1;

    private highestImageIndex: number = 0;


    constructor(private width: number,
                private height: number,
                private maxImageWidth: number,
                private images: Array<ImageDocument>) {}


    public getFirstShownImageIndex = (): number => this.firstShownImageIndex;
    public getLastShownImageIndex = (): number => this.lastShownImageIndex;


    public nextPage(): { newImageIds: string[], scrollWidth: number }|undefined {

        if (this.images.length === 0) return undefined;

        const scrollWidth: number = this.computeScrollWidth();

        this.firstShownImageIndex = this.lastShownImageIndex + 1;
        this.calculateLastShownImageIndex();

        const newImagesIds: string[] = this.getNewImagesIds();

        this.highestImageIndex = Math.max(this.highestImageIndex, this.lastShownImageIndex);

        return {
            newImageIds: newImagesIds,
            scrollWidth: scrollWidth
        }
    }


    private computeScrollWidth(): number {

        let scrollWidth = 0;

        if (this.firstShownImageIndex === -1) return scrollWidth;

        for (let i = this.firstShownImageIndex; i <= this.lastShownImageIndex; i++) {
            scrollWidth += this.images[i].resource.width;
        }

        return scrollWidth;
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


    private getNewImagesIds(): string[] {

        if (this.highestImageIndex >= this.lastShownImageIndex) return [];

        const maxIndex: number = this.lastShownImageIndex === this.images.length - 1
            ? this.lastShownImageIndex
            : this.lastShownImageIndex + 1;

        return this.images.slice(this.highestImageIndex, maxIndex + 1)
            .map(image => image.resource.id);
    }
}