import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Messages, FieldDocument, ImageDocument} from 'idai-components-2';
import {Imagestore} from '../../core/imagestore/imagestore';
import {DoceditComponent} from '../docedit/docedit.component';
import {BlobMaker} from '../../core/imagestore/blob-maker';
import {ImageContainer} from '../../core/imagestore/image-container';
import {DoceditActiveTabService} from '../docedit/docedit-active-tab-service';
import {RoutingService} from '../routing-service';
import {ImageReadDatastore} from '../../core/datastore/field/image-read-datastore';
import {M} from '../m';
import {MenuService} from '../../menu-service';


@Component({
    moduleId: module.id,
    templateUrl: './image-view.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ImageViewComponent implements OnInit {

    @ViewChild('thumbnailSliderContainer') thumbnailSliderContainer: ElementRef;
    @ViewChild('imageInfo') imageInfo: ElementRef;

    public images: Array<ImageContainer> = [];
    public selectedImage: ImageContainer;
    public linkedDocument: FieldDocument|undefined;
    public activeTab: string;
    public openSection: string|undefined = 'stem';

    private subModalOpened: boolean = false;


    constructor(
        private activeModal: NgbActiveModal,
        private datastore: ImageReadDatastore,
        private imagestore: Imagestore,
        private messages: Messages,
        private router: Router,
        private modalService: NgbModal,
        private doceditActiveTabService: DoceditActiveTabService,
        private routingService: RoutingService
    ) {}


    ngOnInit() {

        window.getSelection().removeAllRanges();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && !this.subModalOpened) await this.activeModal.close();
        if (event.key === 'ArrowLeft') await this.selectPrevious();
        if (event.key === 'ArrowRight') await this.selectNext();
    }


    public async initialize(documents: Array<ImageDocument>, selectedDocument: ImageDocument,
                            linkedDocument?: FieldDocument) {

        if (!this.imagestore.getPath()) this.messages.add([M.IMAGESTORE_ERROR_INVALID_PATH_READ]);

        this.linkedDocument = linkedDocument;

        this.images = [];
        await this.select(await this.fetchThumbnail(selectedDocument), false);

        for (let document of documents) {
            if (document === selectedDocument) {
                this.images.push(this.selectedImage);
            } else {
                this.images.push(await this.fetchThumbnail(document));
            }
        }

        this.scrollToThumbnail(this.selectedImage);
    }


    public async select(image: ImageContainer, scroll: boolean = true) {

        if (!image.imgSrc) await this.addOriginal(image);

        this.selectedImage = image;
        if (scroll) this.scrollToThumbnail(image);
    }


    public close() {

        this.activeModal.close();
    }


    public async startEdit(tabName: string = 'fields') {

        this.doceditActiveTabService.setActiveTab(tabName);

        this.subModalOpened = true;
        MenuService.setContext('docedit');

        const doceditModalRef = this.modalService.open(
            DoceditComponent,
            { size: 'lg', backdrop: 'static' }
            );
        const doceditModalComponent = doceditModalRef.componentInstance;
        doceditModalComponent.setDocument(this.selectedImage.document as ImageDocument);

        try {
            const result = await doceditModalRef.result;
            if (result.document) this.selectedImage.document = result.document;
            this.setNextDocumentViewActiveTab();
        } catch (closeReason) {
            if (closeReason === 'deleted') await this.activeModal.close();
        }

        this.subModalOpened = false;
        MenuService.setContext('image-view');
    }


    public async jumpToResource(documentToJumpTo: FieldDocument) {

        await this.routingService.jumpToResource(
            documentToJumpTo, true
        );

        this.activeModal.close();
    }


    public isThumbnailSliderScrollbarVisible(): boolean {

        return this.thumbnailSliderContainer
            && this.thumbnailSliderContainer.nativeElement.scrollWidth
            > this.thumbnailSliderContainer.nativeElement.clientWidth;
    }


    public isImageInfoScrollbarVisible(): boolean {

        return this.imageInfo
            && this.imageInfo.nativeElement.scrollHeight
            > this.imageInfo.nativeElement.clientHeight;
    }


    public containsOriginal(image: ImageContainer): boolean {

        return image.imgSrc !== undefined && image.imgSrc !== '';
    }


    private async fetchThumbnail(document: ImageDocument): Promise<ImageContainer> {

        const image: ImageContainer = { document: document };

        try {
            image.thumbSrc = await this.imagestore.read(document.resource.id, false, true);
        } catch (e) {
            image.thumbSrc = BlobMaker.blackImg;
            this.messages.add([M.IMAGES_ERROR_NOT_FOUND_SINGLE]);
        }

        return image;
    }


    private async addOriginal(image: ImageContainer) {

        if (!image.document) return;

        try {
            image.imgSrc = await this.imagestore.read(
                image.document.resource.id, false, false
            );
        } catch (e) {
            image.imgSrc = BlobMaker.blackImg;
            this.messages.add([M.IMAGES_ERROR_NOT_FOUND_SINGLE]);
        }
    }


    private async selectPrevious() {

        if (this.images.length < 2) return;

        let index: number = this.images.indexOf(this.selectedImage);
        index = index === 0
            ? this.images.length - 1
            : index - 1;

        await this.select(this.images[index]);
    }


    private async selectNext() {

        if (this.images.length < 2) return;

        let index: number = this.images.indexOf(this.selectedImage);
        index = index === this.images.length - 1
            ? 0
            : index + 1;

        await this.select(this.images[index]);
    }


    private scrollToThumbnail(image: ImageContainer) {

        const element: HTMLElement|null = document.getElementById(
            'thumbnail-' + (image.document as ImageDocument).resource.id
        );

        if (element) element.scrollIntoView({ inline: 'center' });
    }


    private setNextDocumentViewActiveTab() {

        const nextActiveTab = this.doceditActiveTabService.getActiveTab();
        if (['relations', 'fields'].indexOf(nextActiveTab) != -1) {
            this.activeTab = nextActiveTab;
        }
    }
}
