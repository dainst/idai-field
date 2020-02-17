import {Component, ElementRef, Input, OnChanges, ViewChild, EventEmitter, Output} from '@angular/core';
import {SafeResourceUrl} from '@angular/platform-browser';
import {to} from 'tsfun';
import {asyncReduce} from 'tsfun-extra';
import {Document} from 'idai-components-2';
import {ImageRow, ImageRowUpdate} from '../../../core/images/row/image-row';
import {ReadImagestore} from '../../../core/images/imagestore/read-imagestore';
import {ImageReadDatastore} from '../../../core/datastore/field/image-read-datastore';
import {AngularUtility} from '../../../angular/angular-utility';


const MAX_IMAGE_WIDTH: number = 600;

export const PLACEHOLDER = 'PLACEHOLDER';

export type ImageRowItem = {

    imageId: string|'PLACEHOLDER';
    document: Document;
}


@Component({
    selector: 'image-row',
    moduleId: module.id,
    templateUrl: './image-row.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ImageRowComponent implements OnChanges {

    @ViewChild('imageRowContainer', { static: true }) containerElement: ElementRef;
    @ViewChild('imageRow', { static: false }) imageRowElement: ElementRef;

    @Input() images: Array<ImageRowItem>;
    @Input() selectedImage: ImageRowItem;

    @Input() highlightOnHover: boolean = false;
    @Input() showResourceInfoOnHover: boolean = false;
    @Input() allowSelection: boolean = false;

    @Output() onImageClicked: EventEmitter<ImageRowItem> = new EventEmitter<ImageRowItem>();
    @Output() onImageSelected: EventEmitter<ImageRowItem> = new EventEmitter<ImageRowItem>();

    public thumbnailUrls: { [imageId: string]: SafeResourceUrl };
    public initializing: boolean;

    private imageRow: ImageRow;


    constructor(private imagestore: ReadImagestore,
                private datastore: ImageReadDatastore) {}


    public hasNextPage = (): boolean => this.imageRow && this.imageRow.hasNextPage();

    public hasPreviousPage = (): boolean => this.imageRow && this.imageRow.hasPreviousPage();

    public nextPage = () => this.applyUpdate(this.imageRow.nextPage());

    public previousPage = () => this.applyUpdate(this.imageRow.previousPage());


    async ngOnChanges() {

        if (!this.images) return;

        this.initializing = true;

        this.imageRow = new ImageRow(
            this.containerElement.nativeElement.offsetWidth,
            this.containerElement.nativeElement.offsetHeight,
            MAX_IMAGE_WIDTH,
            await this.datastore.getMultiple(this.images.map(to('imageId')))
        );

        if (this.allowSelection && this.images.length > 0) {
            await this.select(this.selectedImage ? this.selectedImage : this.images[0]);
        } else {
            await this.nextPage();
        }

        this.initializing = false;
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'ArrowLeft') await this.selectPrevious();
        if (event.key === 'ArrowRight') await this.selectNext();
    }


    public onThumbnailClicked(image: ImageRowItem) {

        this.allowSelection
            ? this.select(image)
            : this.onImageClicked.emit(image);
    }


    public hasImageUrl(image: ImageRowItem): boolean {

        return this.thumbnailUrls !== undefined
            && this.thumbnailUrls[image.imageId] !== undefined
            && this.thumbnailUrls[image.imageId] !== PLACEHOLDER;
    }


    public isPlaceholder(image: ImageRowItem): boolean {

        return image.imageId === PLACEHOLDER;
    }


    public async select(image: ImageRowItem) {

        this.selectedImage = image;
        await this.applyUpdate(this.imageRow.switchToSelected(image));
        this.onImageSelected.emit(image);
    }


    private async selectPrevious() {

        if (!this.selectedImage || this.images.length < 2) return;

        let index: number = this.images.indexOf(this.selectedImage);
        index = index === 0
            ? this.images.length - 1
            : index - 1;

        await this.select(this.images[index]);
    }


    private async selectNext() {

        if (!this.selectedImage || this.images.length < 2) return;

        let index: number = this.images.indexOf(this.selectedImage);
        index = index === this.images.length - 1
            ? 0
            : index + 1;

        await this.select(this.images[index]);
    }


    private async applyUpdate(update: ImageRowUpdate) {

        await this.updateThumbnailUrls(update.newImageIds);
        await AngularUtility.refresh();
        this.scroll(update);
    }


    private async updateThumbnailUrls(imageIds: string[]) {

        const thumbnailUrls: { [imageId: string]: SafeResourceUrl } = this.thumbnailUrls || {};

        await asyncReduce(async (result: { [imageId: string]: SafeResourceUrl }, imageId: string) => {
            if (imageId !== PLACEHOLDER) {
                result[imageId] = await this.imagestore.read(imageId, false, true);
            }
            return result;
        }, thumbnailUrls)(imageIds);

        this.thumbnailUrls = thumbnailUrls;
    }


    private scroll(update: ImageRowUpdate) {

        if (update.firstShownImageIndex === -1) return;

        const element: HTMLElement = this.imageRowElement.nativeElement
            .getElementsByClassName('image-container')
            .item(update.firstShownImageIndex);
        this.imageRowElement.nativeElement.style.transform = 'translateX(-' + element.offsetLeft + 'px)';
    }
}