import { Component, OnChanges, Input, NgZone, ChangeDetectorRef, ElementRef, ViewChild,
    OnDestroy } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { ImageDocument, ImageStore, ImageVariant } from 'idai-field-core';
import { ImageUrlMaker } from '../../../services/imagestore/image-url-maker';
import { showMissingImageMessageOnConsole, showMissingOriginalImageMessageOnConsole } from '../log-messages';
import { Messages } from '../../messages/messages';
import { M } from '../../messages/m';
import { Loading } from '../../widgets/loading';
import { AngularUtility } from '../../../angular/angular-utility';

const panzoom = require('panzoom');


type LoadingResult = {
    imageUrl: SafeResourceUrl;
    isOriginal: boolean;
};


@Component({
    selector: 'image-viewer',
    templateUrl: './image-viewer.html',
    host: {
        '(window:resize)': 'onResize()'
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ImageViewerComponent implements OnChanges, OnDestroy {

    @Input() imageDocument: ImageDocument;

    @ViewChild('container') containerElement: ElementRef;
    @ViewChild('image') imageElement: ElementRef;
    @ViewChild('preloadImage') preloadImageElement: ElementRef;
    @ViewChild('overlay') overlayElement: ElementRef;

    public imageUrl: SafeResourceUrl;
    public isOriginal: boolean;
    public maxZoom: number;
    public panning: boolean = false;
    public loadingIconVisible: boolean = false;
    public loadingIconTimeout: any = undefined;

    private loadedImageId: string;
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
        
        if (this.imageDocument) await this.update();
    }


    ngOnDestroy() {
        
        this.resetPanZoom();
    }


    public onResize() {

        this.resetPanZoom();
        this.setupPanZoom();
    }


    public isImageContainerVisible(): boolean {
        
        return !this.loadingIconVisible
            || (this.imageDocument?.resource.id === this.loadedImageId);
    }


    public isOriginalNotFoundWarningVisible(): boolean {

        return this.imageUrl
            && !this.isOriginal
            && !this.loadingIconVisible;
    }


    public async onImageLoaded() {

        this.stopLoading();
        await this.setupPanZoom();

        this.overlayElement.nativeElement.style['z-index'] = 1000;
    }


    private async update() {

        this.stopLoading();
        await AngularUtility.refresh();

        if (this.imageDocument.resource.id === this.loadedImageId) return;
        
        this.zone.run(async () => {
            const imageId: string = this.imageDocument.resource.id;
            const result: LoadingResult = await this.loadImage(this.imageDocument);
            if (imageId === this.imageDocument.resource.id) {
                this.loadedImageId = imageId;
                this.imageUrl = result.imageUrl;
                this.isOriginal = result.isOriginal;
                if (!this.isOriginal) this.showMissingImageMessageOnConsole();
            }
        });
    }


    private async loadImage(document: ImageDocument): Promise<LoadingResult> {

        this.startLoading();
        this.overlayElement.nativeElement.style['z-index'] = 1002;
        this.changeDetectorRef.detectChanges();

        let imageUrl: SafeResourceUrl;
        let isOriginal: boolean;

        try {
            imageUrl = await this.imageUrlMaker.getUrl(document.resource.id, ImageVariant.DISPLAY);
            isOriginal = true;
        } catch (_) {
            imageUrl = await this.imageUrlMaker.getUrl(document.resource.id, ImageVariant.THUMBNAIL);
            isOriginal = false;
        }

        this.changeDetectorRef.detectChanges();
        
        return { imageUrl, isOriginal };
    }


    private startLoading() {

        this.loading.start('image-viewer', false);

        this.loadingIconTimeout = setTimeout(() => {
            this.loadingIconVisible = true;
        }, 250);
    }


    private stopLoading() {

        if (this.loadingIconTimeout) {
            clearTimeout(this.loadingIconTimeout);
            this.loadingIconTimeout = undefined;
        }
        this.loading.stop('image-viewer', false);
        this.loadingIconVisible = false;
    }


    private showMissingImageMessageOnConsole() {

        const imageId: string = this.imageDocument?.resource.id ?? 'unknown';

        if (this.imageUrl === ImageUrlMaker.blackImg) {
            showMissingImageMessageOnConsole(imageId);
        } else {
            showMissingOriginalImageMessageOnConsole(imageId);
        }
    }


    private async setupPanZoom() {

        await AngularUtility.refresh();

        this.maxZoom = this.calculateMaxZoom();
        this.imageElement.nativeElement.style.transform = 'none';
        this.preloadImageElement.nativeElement.style.transform
            = `matrix(${this.maxZoom}, 0, 0, ${this.maxZoom}, 0, 0)`;

        this.panzoomInstance = panzoom(
            this.imageElement.nativeElement,
            {
                smoothScroll: false,
                zoomDoubleClickSpeed: 1,
                initialZoom: 1,
                maxZoom: this.maxZoom,
                minZoom: 1
            }
        );

        this.setupPanZoomEvents();
        this.centerImage();

        if (!this.isOriginal) this.panzoomInstance.pause();
    }


    private setupPanZoomEvents() {

        this.panzoomInstance.on('zoom', () => {
            this.changeDetectorRef.detectChanges();
        });

        this.panzoomInstance.on('zoomend', () => {
            this.zooming = false;
            this.changeDetectorRef.detectChanges();
        });

        this.panzoomInstance.on('panstart', () => {
            this.panning = true;
            this.changeDetectorRef.detectChanges();
        });

        this.panzoomInstance.on('panend', () => {
            this.panning = false;
            this.changeDetectorRef.detectChanges();
        });
    }


    private centerImage() {

        const imageBounds: any = this.imageElement.nativeElement.getBoundingClientRect();
        const containerBounds: any = this.containerElement.nativeElement.getBoundingClientRect();
        const x: number = containerBounds.width / 2 - imageBounds.width / 2;
        const y: number = containerBounds.height / 2 - imageBounds.height / 2;

        this.panzoomInstance.moveTo(x, y);
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

        const containerBounds: any = this.containerElement.nativeElement.getBoundingClientRect();
        const x: number = containerBounds.width / 2;
        const y: number = containerBounds.height / 2;

        this.panzoomInstance.smoothZoom(x, y, value);
    }


    private calculateMaxZoom(): number {

        const imageWidth: number = this.imageElement.nativeElement.naturalWidth;
        const imageHeight: number = this.imageElement.nativeElement.naturalHeight;

        const containerWidth: number = this.containerElement.nativeElement.getBoundingClientRect().width;
        const containerHeight: number = this.containerElement.nativeElement.getBoundingClientRect().height;
        
        return Math.max(1, Math.max(imageWidth / containerWidth, imageHeight / containerHeight));
    }
}
