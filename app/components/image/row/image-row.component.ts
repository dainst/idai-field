import {Component, ElementRef, Input, OnChanges, ViewChild} from '@angular/core';
import {asyncMap} from 'tsfun-extra';
import {ImageDocument} from 'idai-components-2';
import {ImageRow, ImageRowUpdate} from '../../../core/images/row/image-row';
import {ReadImagestore} from '../../../core/images/imagestore/read-imagestore';


const MAX_IMAGE_WIDTH: number = 600;


@Component({
    selector: 'image-row',
    moduleId: module.id,
    templateUrl: './image-row.html',
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ImageRowComponent implements OnChanges {

    @ViewChild('imageRowContainer', { static: false }) containerElement: ElementRef;
    @ViewChild('imageRow', { static: false }) imageRowElement: ElementRef;

    @Input() images: Array<ImageDocument>;

    public linkedThumbnailUrls: string[] = [];

    private imageRow: ImageRow;


    constructor(private imagestore: ReadImagestore) {}


    public hasNextPage = (): boolean => this.imageRow && this.imageRow.hasNextPage();

    public hasPreviousPage = (): boolean => this.imageRow && this.imageRow.hasPreviousPage();

    public nextPage = () => this.applyUpdate(this.imageRow.nextPage());

    public previousPage = () => this.applyUpdate(this.imageRow.previousPage());


    async ngOnChanges() {

        if (!this.images) return;

        this.imageRow = new ImageRow(
            this.containerElement.nativeElement.offsetWidth,
            this.containerElement.nativeElement.offsetHeight,
            MAX_IMAGE_WIDTH,
            this.images
        );

        await this.nextPage();
    }


    private async applyUpdate(update: ImageRowUpdate) {

        this.linkedThumbnailUrls = this.linkedThumbnailUrls.concat(
            await this.getThumbnailUrls(update.newImageIds)
        );

        this.imageRowElement.nativeElement.style.left = update.positionLeft + 'px';
    }


    private async getThumbnailUrls(imageIds: string[]): Promise<string[]> {

        return asyncMap((imageId: string) => {
            return this.imagestore.read(imageId, false, true);
        })(imageIds);
    }
}