import {ImageDocument} from 'idai-components-2';
import {ImageWidthCalculator} from './image-width-calculator';


export type ImageRowUpdate = { newImageIds: string[], positionLeft: number };


/**
 * @author Thomas Kleinke
 */
export class ImageRow {

    private firstShownImageIndex: number = 0;
    private lastShownImageIndex: number = 0;
    private highestImageIndex: number = -1;

    private positionLeft: number = 0;


    constructor(private width: number,
                private height: number,
                private maxImageWidth: number,
                private images: Array<ImageDocument>) {}


    public nextPage(): ImageRowUpdate {

        if (this.images.length === 0) return { newImageIds: [], positionLeft: 0 };

        this.positionLeft -= this.computeScrollWidth();

        this.firstShownImageIndex = this.lastShownImageIndex;
        this.calculateLastShownImageIndex();

        const newImagesIds: string[] = this.getNewImagesIds();

        this.highestImageIndex = Math.max(this.highestImageIndex, this.lastShownImageIndex);

        return {
            newImageIds: newImagesIds,
            positionLeft: this.positionLeft
        }
    }


    public previousPage(): ImageRowUpdate {

        if (this.images.length === 0) return { newImageIds: [], positionLeft: 0 };

        this.lastShownImageIndex = this.firstShownImageIndex;
        this.calculateFirstShownImageIndex();

        this.highestImageIndex = Math.max(this.highestImageIndex, this.lastShownImageIndex);

        this.positionLeft += this.computeScrollWidth();

        return {
            newImageIds: [],
            positionLeft: this.positionLeft
        }
    }


    public hasNextPage(): boolean {

        return this.lastShownImageIndex + 1 < this.images.length;
    }


    public hasPreviousPage(): boolean {

        return this.firstShownImageIndex > 0;
    }


    private computeScrollWidth(): number {

        let scrollWidth = 0;

        if (this.lastShownImageIndex === 0) return scrollWidth;

        for (let i = this.firstShownImageIndex; i < this.lastShownImageIndex; i++) {
            scrollWidth += this.calculateImageWidth(this.images[i]);
        }

        return scrollWidth;
    }


    private calculateImageWidth(image: ImageDocument) {

        return ImageWidthCalculator.computeWidth(
            image.resource.width, image.resource.height, this.height, this.maxImageWidth
        );
    }


    private calculateLastShownImageIndex() {

        let availableWidth: number = this.width;

        for (let i = this.firstShownImageIndex; i < this.images.length; i++) {
            availableWidth -= this.calculateImageWidth(this.images[i]);
            this.lastShownImageIndex = i;
            if (availableWidth < 0) break;
        }
    }


    private calculateFirstShownImageIndex() {

        let availableWidth: number = this.width;

        for (let i = this.lastShownImageIndex - 1; i >= 0; i--) {
            availableWidth -= this.calculateImageWidth(this.images[i]);
            if (availableWidth < 0) break;
            this.firstShownImageIndex = i;
        }
    }


    private getNewImagesIds(): string[] {

        if (this.highestImageIndex >= this.lastShownImageIndex) return [];

        return this.images.slice(this.highestImageIndex + 1, this.lastShownImageIndex + 1)
            .map(image => image.resource.id);
    }
}