import { ImageDocument, Document } from 'idai-field-core';
import { ImageWidthCalculator } from './image-width-calculator';


export type ImageRowUpdate = { newImageIds: string[], firstShownImageIndex: number };

export type ImageRowItem = {

  imageId: string|'PLACEHOLDER';
  document?: Document;
};


export namespace ImageRowItem {

    export const IMAGE_ID = 'imageId';

    export const ofDocument = (document: ImageDocument): ImageRowItem => ({ imageId: document.resource.id, document });
}

type PageInfo = 'same'|'previous'|'next'|'notFound';

export const PLACEHOLDER = 'PLACEHOLDER';


/**
 * @author Thomas Kleinke
 */
export class ImageRow {

    private firstShownImageIndex = 0;
    private lastShownImageIndex = 0;
    private highestImageIndex = -1;

    private lastImageFullyVisible = false;
    private imageWidths: { [imageId: string]: number } = {};


    constructor(private width: number,
                private height: number,
                private maxImageWidth: number,
                private placeholderWidth: number,
                private images: Array<ImageDocument>,
                thumbnailIds: string[]) {

        this.imageWidths = this.calculateImageWidths(images, thumbnailIds);
    }


    public nextPage(): ImageRowUpdate {

        if (this.images.length === 0) return { newImageIds: [], firstShownImageIndex: -1 };

        this.firstShownImageIndex = this.lastShownImageIndex;
        this.calculateLastShownImageIndex();
        this.lastImageFullyVisible = this.isLastImageFullyVisible();

        const newImagesIds: string[] = this.getNewImagesIds();

        this.highestImageIndex = Math.max(this.highestImageIndex, this.lastShownImageIndex);

        return {
            newImageIds: newImagesIds,
            firstShownImageIndex: this.firstShownImageIndex
        };
    }


    public previousPage(): ImageRowUpdate {

        if (this.images.length === 0) return { newImageIds: [], firstShownImageIndex: -1 };

        this.lastShownImageIndex = this.firstShownImageIndex;
        this.calculateFirstShownImageIndex();
        this.calculateLastShownImageIndex();
        this.lastImageFullyVisible = this.isLastImageFullyVisible();

        this.highestImageIndex = Math.max(this.highestImageIndex, this.lastShownImageIndex);

        return {
            newImageIds: [],
            firstShownImageIndex: this.firstShownImageIndex
        }
    }


    public switchToSelected(selected: ImageRowItem): ImageRowUpdate {

        const update: ImageRowUpdate = { newImageIds: [], firstShownImageIndex: -1 };

        let pageInfo: PageInfo;
        while ((pageInfo = this.getPageInfo(selected)) !== 'same') {
            if (pageInfo === 'previous') {
                const newUpdate: ImageRowUpdate = this.previousPage();
                update.newImageIds = update.newImageIds.concat(newUpdate.newImageIds);
                update.firstShownImageIndex = newUpdate.firstShownImageIndex
            } else if (pageInfo === 'next') {
                const newUpdate: ImageRowUpdate = this.nextPage();
                update.newImageIds = update.newImageIds.concat(newUpdate.newImageIds);
                update.firstShownImageIndex = newUpdate.firstShownImageIndex
            } else {
                break;
            }
        }

        return update;
    }


    public setWidth(width: number): ImageRowUpdate {

        this.width = width;

        this.lastShownImageIndex = this.firstShownImageIndex;
        return this.nextPage();
    }


    public hasNextPage(): boolean {

        return this.lastShownImageIndex < this.images.length && !this.lastImageFullyVisible;
    }


    public hasPreviousPage(): boolean {

        return this.firstShownImageIndex > 0;
    }


    public getImageWidth(imageId: string): number {

        return this.imageWidths[imageId];
    }


    private calculateImageWidths(images: Array<ImageDocument>, thumbnailIds: string[]): { [imageId: string]: number } {

        return images.reduce((imageWidths: { [imageId: string]: number }, image: ImageDocument) => {
            imageWidths[image.resource.id] = this.calculateImageWidth(image, thumbnailIds);
            return imageWidths;
        }, {});
    }


    private calculateImageWidth(image: ImageDocument, thumbnailIds: string[]): number {

        if (!thumbnailIds.includes(image.resource.id)) return this.placeholderWidth;

        return image.resource.id === PLACEHOLDER
            ? this.placeholderWidth
            : ImageWidthCalculator.computeWidth(
                image.resource.width, image.resource.height, this.height, this.maxImageWidth
            );
    }


    private calculateLastShownImageIndex() {

        let availableWidth: number = this.width;

        for (let i = this.firstShownImageIndex; i < this.images.length; i++) {
            availableWidth -= this.getImageWidth(this.images[i].resource.id);
            this.lastShownImageIndex = i;
            if (availableWidth < 0) break;
        }
    }


    private calculateFirstShownImageIndex() {

        let availableWidth: number = this.width;

        for (let i = this.lastShownImageIndex - 1; i >= 0; i--) {
            availableWidth -= this.getImageWidth(this.images[i].resource.id);
            if (availableWidth < 0) break;
            this.firstShownImageIndex = i;
        }
    }


    private getNewImagesIds(): string[] {

        if (this.highestImageIndex >= this.lastShownImageIndex) return [];

        return this.images.slice(this.highestImageIndex + 1, this.lastShownImageIndex + 1)
            .map(image => image.resource.id);
    }


    private isLastImageFullyVisible(): boolean {

        let availableWidth: number = this.width;

        for (let i = this.firstShownImageIndex; i <= this.lastShownImageIndex; i++) {
            availableWidth -= this.getImageWidth(this.images[i].resource.id);
            if (availableWidth < 0) return false;
        }

        return true;
    }


    private getPageInfo(imageRowItem: ImageRowItem): PageInfo {

        const index: number = this.images.indexOf(
            this.images.find(image => image.resource.id === imageRowItem.imageId) as ImageDocument
        );

        if (index === -1) {
            return 'notFound';
        } else if (this.firstShownImageIndex > index) {
            return 'previous';
        } else if (this.lastShownImageIndex < index
                || (this.lastShownImageIndex === index && !this.lastImageFullyVisible)) {
            return 'next';
        } else {
            return 'same';
        }
    }
}
