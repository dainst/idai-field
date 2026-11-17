import { Component, ElementRef, Input, OnChanges, ViewChild, EventEmitter, Output, SimpleChanges, OnInit,
    OnDestroy } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { to, aReduce, Map } from 'tsfun';
import { Datastore, FileInfo, ImageDocument, ImageStore, ImageVariant } from 'idai-field-core';
import { ImageRow, ImageRowItem, ImageRowUpdate, PLACEHOLDER } from './image-row';
import { AngularUtility } from '../../../angular/angular-utility';
import { showMissingThumbnailMessageOnConsole } from '../log-messages';
import { ImageUrlMaker } from '../../../services/imagestore/image-url-maker';
import { ImageToolLauncher } from '../../../services/imagestore/image-tool-launcher';
import { SettingsProvider } from '../../../services/settings/settings-provider';


const MAX_IMAGE_WIDTH = 600;
const PLACEHOLDER_WIDTH = 150;


@Component({
    selector: 'image-row',
    templateUrl: './image-row.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
        '(window:resize)': 'onResize()'
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ImageRowComponent implements OnInit, OnChanges, OnDestroy {

    @ViewChild('imageRowContainer', { static: true }) containerElement: ElementRef;
    @ViewChild('imageRow', { static: false }) imageRowElement: ElementRef;

    @Input() images: Array<ImageRowItem>;
    @Input() selectedImage: ImageRowItem;

    @Input() highlightOnHover = false;
    @Input() allowSelection = false;

    @Output() onImageClicked: EventEmitter<ImageRowItem> = new EventEmitter<ImageRowItem>();
    @Output() onImageSelected: EventEmitter<ImageRowItem> = new EventEmitter<ImageRowItem>();

    public thumbnailUrls: { [imageId: string]: SafeResourceUrl };
    public initializing: boolean;

    private imageRow: ImageRow;
    private downloadSubscription: Subscription;


    constructor(private imageUrlMaker: ImageUrlMaker,
                private datastore: Datastore,
                private imageStore: ImageStore,
                private settingsProvider: SettingsProvider,
                private imageToolLauncher: ImageToolLauncher) {}


    public hasNextPage = (): boolean => this.imageRow && this.imageRow.hasNextPage();

    public hasPreviousPage = (): boolean => this.imageRow && this.imageRow.hasPreviousPage();

    public nextPage = () => this.applyUpdate(this.imageRow.nextPage());

    public previousPage = () => this.applyUpdate(this.imageRow.previousPage());

    public getImageWidth = (image: ImageRowItem) => this.imageRow.getImageWidth(image.imageId);


    ngOnInit() {
        
        this.downloadSubscription = this.imageToolLauncher.downloadNotifications()
            .subscribe(async () => await this.initialize());
    }


    ngOnDestroy() {
        
        if (this.downloadSubscription) this.downloadSubscription.unsubscribe();
    }


    async ngOnChanges(changes: SimpleChanges) {

        if (!this.images || !changes['images']) return;

        await this.initialize();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'ArrowLeft') await this.selectPrevious();
        if (event.key === 'ArrowRight') await this.selectNext();
    }


    public async onResize() {

        await this.applyUpdate(this.imageRow.setWidth(this.containerElement.nativeElement.offsetWidth));
    }


    public onThumbnailClicked(image: ImageRowItem) {

        this.allowSelection
            ? this.select(image)
            : this.onImageClicked.emit(image);
    }


    public hasImageUrl(image: ImageRowItem): boolean {

        return this.thumbnailUrls !== undefined
            && this.thumbnailUrls[image.imageId] !== undefined
            && this.thumbnailUrls[image.imageId] !== PLACEHOLDER
            && this.thumbnailUrls[image.imageId] !== ImageUrlMaker.blackImg;
    }


    public async select(image: ImageRowItem) {

        this.selectedImage = image;
        await this.applyUpdate(this.imageRow.switchToSelected(image));
        this.onImageSelected.emit(image);
    }


    private async initialize() {

        this.initializing = true;

        await AngularUtility.refresh();

        this.imageRow = new ImageRow(
            this.containerElement.nativeElement.offsetWidth,
            this.containerElement.nativeElement.offsetHeight,
            MAX_IMAGE_WIDTH,
            PLACEHOLDER_WIDTH,
            await this.fetchImageDocuments(this.images),
            await this.fetchThumbnailIds()
        );

        this.initializing = false;

        if (this.allowSelection && this.images.length > 0) {
            await this.select(this.selectedImage ? this.selectedImage : this.images[0]);
        } else {
            await this.nextPage();
        }
    }


    private async selectPrevious() {

        if (!this.selectedImage || this.images.length < 2) return;

        let index = this.images.indexOf(this.selectedImage);
        index = index === 0
            ? this.images.length - 1
            : index - 1;

        await this.select(this.images[index]);
    }


    private async selectNext() {

        if (!this.selectedImage || this.images.length < 2) return;

        let index = this.images.indexOf(this.selectedImage);
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

        this.thumbnailUrls = await aReduce(
            imageIds,
            async (result: { [imageId: string]: SafeResourceUrl }, imageId: string) => {
                if (imageId !== PLACEHOLDER) {
                    try {
                        result[imageId] = await this.imageUrlMaker.getUrl(imageId, ImageVariant.THUMBNAIL);
                    } catch (e) {
                        result[imageId] = ImageUrlMaker.blackImg;
                        showMissingThumbnailMessageOnConsole(imageId);
                    }
                }
                return result;
            },
            this.thumbnailUrls || {});
    }


    private scroll(update: ImageRowUpdate) {

        if (update.firstShownImageIndex === -1) return;

        const element: HTMLElement = this.imageRowElement.nativeElement
            .getElementsByClassName('image-container')
            .item(update.firstShownImageIndex);
        this.imageRowElement.nativeElement.style.transform = 'translateX(-' + element.offsetLeft + 'px)';
    }


    private async fetchImageDocuments(images: Array<ImageRowItem>): Promise<Array<ImageDocument>> {

        const imageDocuments = (await this.datastore.getMultiple(
            images.filter(image => image.imageId !== PLACEHOLDER)
                .map(to(ImageRowItem.IMAGE_ID))
        )) as Array<ImageDocument>;

        return images.map(image =>
            imageDocuments.find(imageDocument => imageDocument.resource.id === image.imageId)
            ?? { resource: { id: PLACEHOLDER, width: PLACEHOLDER_WIDTH }} as ImageDocument
        );
    }


    private async fetchThumbnailIds(): Promise<string[]> {

        const fileInfos: Map<FileInfo> = await this.imageStore.getFileInfos(
            this.settingsProvider.getSettings().selectedProject,
            [ImageVariant.THUMBNAIL]
        );

        return this.images.filter(image => fileInfos[image.document.resource.id]).map(image => image.document.resource.id);
    }
}
