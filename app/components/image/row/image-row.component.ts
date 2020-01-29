import {Component, ElementRef, Input, OnChanges, ViewChild} from '@angular/core';
import {asyncMap} from 'tsfun-extra';
import {ImageRow, ImageRowUpdate} from '../../../core/images/row/image-row';
import {ReadImagestore} from '../../../core/images/imagestore/read-imagestore';
import {ImageReadDatastore} from '../../../core/datastore/field/image-read-datastore';


const MAX_IMAGE_WIDTH: number = 600;


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

    @Input() imageIds: string[];

    public linkedThumbnailUrls: string[] = [];

    private imageRow: ImageRow;


    constructor(private imagestore: ReadImagestore,
                private datastore: ImageReadDatastore) {}


    public hasNextPage = (): boolean => this.imageRow && this.imageRow.hasNextPage();

    public hasPreviousPage = (): boolean => this.imageRow && this.imageRow.hasPreviousPage();

    public nextPage = () => this.applyUpdate(this.imageRow.nextPage());

    public previousPage = () => this.applyUpdate(this.imageRow.previousPage());


    async ngOnChanges() {

        if (!this.imageIds) return;

        this.imageRow = new ImageRow(
            this.containerElement.nativeElement.offsetWidth,
            this.containerElement.nativeElement.offsetHeight,
            MAX_IMAGE_WIDTH,
            await this.datastore.getMultiple(this.imageIds)
        );

        await this.nextPage();
    }


    private async applyUpdate(update: ImageRowUpdate) {

        this.linkedThumbnailUrls = this.linkedThumbnailUrls.concat(
            await this.getThumbnailUrls(update.newImageIds)
        );

        this.imageRowElement.nativeElement.style.transform = 'translateX(' + update.positionLeft + 'px)';
    }


    private async getThumbnailUrls(imageIds: string[]): Promise<string[]> {

        return asyncMap((imageId: string) => {
            return this.imagestore.read(imageId, false, true);
        })(imageIds);
    }
}