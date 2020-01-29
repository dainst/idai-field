import {Component, ElementRef, Input, OnChanges, ViewChild} from '@angular/core';
import {asyncMap} from 'tsfun-extra';
import {ReadImagestore} from '../../core/images/imagestore/read-imagestore';
import {ImageRow, ImageRowUpdate} from '../../core/images/row/image-row';


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

    @ViewChild('imageRow', { static: false }) imageRowElement: ElementRef;

    @Input() imageRow: ImageRow;

    public linkedThumbnailUrls: string[] = [];


    constructor(private imagestore: ReadImagestore) {}


    public hasNextPage = (): boolean => this.imageRow && this.imageRow.hasNextPage();

    public hasPreviousPage = (): boolean => this.imageRow && this.imageRow.hasPreviousPage();


    async ngOnChanges() {

        if (this.imageRow) await this.nextPage();
    }


    public async nextPage() {

        const result: ImageRowUpdate = this.imageRow.nextPage();

        this.linkedThumbnailUrls = this.linkedThumbnailUrls.concat(
            await this.getThumbnailUrls(result.newImageIds)
        );

        this.imageRowElement.nativeElement.style.left = result.positionLeft + 'px';
    }


    public async previousPage() {

        const result: ImageRowUpdate = this.imageRow.previousPage();
        this.imageRowElement.nativeElement.style.left = result.positionLeft + 'px';
    }


    private async getThumbnailUrls(imageIds: string[]): Promise<string[]> {

        return asyncMap((imageId: string) => {
            return this.imagestore.read(imageId, false, true);
        })(imageIds);
    }
}