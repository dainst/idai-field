import {Component, ElementRef, Input, OnChanges, ViewChild, EventEmitter, Output} from '@angular/core';
import {to} from 'tsfun';
import {asyncReduce} from 'tsfun-extra';
import {FieldResource} from 'idai-components-2';
import {ImageRow, ImageRowUpdate} from '../../../core/images/row/image-row';
import {ReadImagestore} from '../../../core/images/imagestore/read-imagestore';
import {ImageReadDatastore} from '../../../core/datastore/field/image-read-datastore';


const MAX_IMAGE_WIDTH: number = 600;


export type ImageRowItem = {

    imageId: string;
    resource: FieldResource;
}


@Component({
    selector: 'image-row',
    moduleId: module.id,
    templateUrl: './image-row.html'
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ImageRowComponent implements OnChanges {

    @ViewChild('imageRowContainer', { static: true }) containerElement: ElementRef;
    @ViewChild('imageRow', { static: false }) imageRowElement: ElementRef;

    @Input() images: Array<ImageRowItem>;
    @Input() highlightOnHover: boolean = false;

    @Output() onImageClicked: EventEmitter<ImageRowItem> = new EventEmitter<ImageRowItem>();

    public thumbnailUrls: { [imageId: string]: string };

    private imageRow: ImageRow;


    constructor(private imagestore: ReadImagestore,
                private datastore: ImageReadDatastore) {}


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
            await this.datastore.getMultiple(this.images.map(to('imageId')))
        );

        await this.nextPage();
    }


    public onThumbnailClicked(image: ImageRowItem) {

        this.onImageClicked.emit(image);
    }


    private async applyUpdate(update: ImageRowUpdate) {

        await this.updateThumbnailUrls(update.newImageIds);
        this.imageRowElement.nativeElement.style.transform = 'translateX(' + update.positionLeft + 'px)';
    }


    private async updateThumbnailUrls(imageIds: string[]) {

        const thumbnailUrls: { [imageId: string]: string } = this.thumbnailUrls || {};

        await asyncReduce(async (result: { [imageId: string]: string }, imageId: string) => {
            result[imageId] = await this.imagestore.read(imageId, false, true);
            return result;
        }, thumbnailUrls)(imageIds);

        this.thumbnailUrls = thumbnailUrls;
    }
}