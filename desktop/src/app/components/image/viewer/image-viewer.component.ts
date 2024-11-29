import { Component, OnChanges, Input, NgZone, ChangeDetectorRef, ElementRef, ViewChild,
    OnDestroy } from '@angular/core';
import { ImageDocument, ImageResource, ImageStore, ImageVariant } from 'idai-field-core';
import { ImageContainer } from '../../../services/imagestore/image-container';
import { ImageUrlMaker } from '../../../services/imagestore/image-url-maker';
import { showMissingImageMessageOnConsole, showMissingOriginalImageMessageOnConsole } from '../log-messages';
import { Messages } from '../../messages/messages';
import { M } from '../../messages/m';
import { Loading } from '../../widgets/loading';
import { AngularUtility } from '../../../angular/angular-utility';

const panzoom = require('panzoom');


@Component({
    selector: 'image-viewer',
    templateUrl: './image-viewer.html',
    host: {
        '(window:resize)': 'onResize()'
    }
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ImageViewerComponent implements OnChanges, OnDestroy {

    @Input() image: ImageDocument;

    @ViewChild('container') containerElement: ElementRef;
    @ViewChild('originalImage') imageElement: ElementRef;

    public imageContainer: ImageContainer;
    public maxZoom: number;
    public loadingIconVisible: boolean = false;
    public loadingIconTimeout: any = undefined;

    private panzoomInstance: any;
    private zooming: boolean = false;


    constructor(private imageUrlMaker: ImageUrlMaker,
                private imagestore: ImageStore,
                private messages: Messages,
                private loading: Loading,
                private zone: NgZone,
                private changeDetectorRef: ChangeDetectorRef) {}


    public getScale = () => this.panzoomInstance?.getTransform().scale ?? 0;

    public zoomIn = () => this.zoom(2);

    public zoomOut = () => this.zoom(0.5);


    async ngOnChanges() {

        this.resetPanZoom();

        if (!this.imagestore.getAbsoluteRootPath()) {
            this.messages.add([M.IMAGESTORE_ERROR_INVALID_PATH_READ]);
        }
        
        if (this.image) await this.update();
    }


    ngOnDestroy() {
        
        this.resetPanZoom();
    }


    public onResize() {

        this.resetPanZoom();
        this.setupPanZoom();
    }


    public containsOriginal(imageContainer: ImageContainer): boolean {

        return imageContainer?.imgSrc !== undefined && imageContainer?.imgSrc !== '';
    }


    public isImageContainerVisible(): boolean {
        
        return !this.loadingIconVisible
            || (this.image?.resource.id === this.imageContainer?.document.resource.id);
    }


    public isOriginalNotFoundWarningVisible(): boolean {

        return this.imageContainer
            && !this.containsOriginal(this.imageContainer)
            && !this.loadingIconVisible;
    }


    public stopLoading() {

        if (this.loadingIconTimeout) {
            clearTimeout(this.loadingIconTimeout);
            this.loadingIconTimeout = undefined;
        }
        this.loading.stop('image-viewer', false);
        this.loadingIconVisible = false;
    }


    private async update() {

        this.stopLoading();

        if (this.image.resource.id === this.imageContainer?.document.resource.id) return;
        
        this.zone.run(async () => {
            const newImageContainer: ImageContainer = await this.loadImage(this.image);
            if (newImageContainer.document.resource.id === this.image.resource.id) {
                this.imageContainer = newImageContainer;
                await this.setupPanZoom();
            }
        });
    }


    private async loadImage(document: ImageDocument): Promise<ImageContainer> {

        this.startLoading();
        this.changeDetectorRef.detectChanges();

        const imageContainer: ImageContainer = { document };

        try {
            imageContainer.imgSrc = await this.imageUrlMaker.getUrl(document.resource.id, ImageVariant.DISPLAY);
            this.changeDetectorRef.detectChanges();
        } catch (e) {
            imageContainer.imgSrc = undefined;
            imageContainer.thumbSrc = await this.imageUrlMaker.getUrl(document.resource.id, ImageVariant.THUMBNAIL);
            this.stopLoading();
        }

        this.showConsoleErrorIfImageIsMissing(imageContainer);

        return imageContainer;
    }


    private startLoading() {

        this.loading.start('image-viewer', false);

        this.loadingIconTimeout = setTimeout(() => {
            this.loadingIconVisible = true;
        }, 250);
    }


    private showConsoleErrorIfImageIsMissing(imageContainer: ImageContainer) {

        if (this.containsOriginal(imageContainer)) return;

        const imageId: string = imageContainer.document && imageContainer.document.resource
            ? imageContainer.document.resource.id
            : 'unknown';

        if (imageContainer.thumbSrc === ImageUrlMaker.blackImg) {
            showMissingImageMessageOnConsole(imageId);
        } else {
            showMissingOriginalImageMessageOnConsole(imageId);
        }
    }


    private async setupPanZoom() {

        if (!this.containsOriginal(this.imageContainer)) return;

        await AngularUtility.refresh();

        this.maxZoom = this.calculateMaxZoom();

        this.panzoomInstance = panzoom(
            this.imageElement.nativeElement,
            {
                smoothScroll: false,
                bounds: true,
                zoomDoubleClickSpeed: 1,
                initialZoom: 1,
                maxZoom: this.maxZoom,
                minZoom: 1
            }
        );

        this.panzoomInstance.on('zoom', () => {
            this.changeDetectorRef.detectChanges();
        });

        this.panzoomInstance.on('zoomend', () => {
            this.zooming = false;
            this.changeDetectorRef.detectChanges();
        });
    }


    private resetPanZoom() {

        if (!this.panzoomInstance) return;

        this.panzoomInstance.dispose();
        this.panzoomInstance = undefined;
    }


    private zoom(value: number) {

        if (this.zooming) return;

        if (this.getScale() < 2 && value < 1) value = 0.45;

        this.zooming = true;

        const bounds: any = this.containerElement.nativeElement.getBoundingClientRect();
        const x: number = bounds.width / 2;
        const y: number = bounds.height / 2;

        this.panzoomInstance.smoothZoom(x, y, value);
    }


    private calculateMaxZoom(): number {

        const resource: ImageResource = this.imageContainer.document.resource;
        const dimension: string = resource.width < resource.height ? 'width' : 'height';

        const imageValue: number = resource[dimension];
        const containerValue: number = this.containerElement.nativeElement.getBoundingClientRect()[dimension];
        
        return Math.max(1, imageValue / containerValue);
    }
}
