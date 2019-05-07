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

    public images: Array<ImageContainer> = [];
    public selectedImage: ImageContainer;
    public activeTab: string;
    public originalNotFound: boolean = false;
    public openSection: string|undefined = 'stem';


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

        if (event.key === 'Escape') await this.activeModal.close();
    }


    public async initialize(documents: Array<ImageDocument>, selectedDocument: ImageDocument) {

        if (!this.imagestore.getPath()) this.messages.add([M.IMAGESTORE_ERROR_INVALID_PATH_READ]);

        this.images = [];
        for (let document of documents) {
            this.images.push(await this.fetchImage(document));
        }

        await this.select(this.images.find(image => {
            return image.document !== undefined && image.document ===  selectedDocument;
        }) as ImageContainer);
    }


    public async select(image: ImageContainer) {

        if (!image.imgSrc) await this.addOriginal(image);

        this.selectedImage = image;
        if (!this.selectedImage.imgSrc || this.selectedImage.imgSrc === '') this.originalNotFound = true;
    }


    public close() {

        this.activeModal.close();
    }


    public async startEdit(tabName: string = 'fields') {

        this.doceditActiveTabService.setActiveTab(tabName);

        MenuService.setContext('docedit');

        const doceditModalRef = this.modalService.open(
            DoceditComponent,
            { size: 'lg', backdrop: 'static' }
            );
        const doceditModalComponent = doceditModalRef.componentInstance;
        doceditModalComponent.setDocument(this.selectedImage.document);

        try {
            const result = await doceditModalRef.result;
            if (result.document) this.selectedImage.document = result.document;
            this.setNextDocumentViewActiveTab();
        } catch (closeReason) {
            if (closeReason === 'deleted') await this.activeModal.close();
        }

        MenuService.setContext('default');
    }


    public async jumpToResource(documentToJumpTo: FieldDocument) {

        await this.routingService.jumpToResource(
            documentToJumpTo, true
        );

        this.activeModal.close();
    }


    public isScrollbarVisible(): boolean {

        return this.thumbnailSliderContainer
            && this.thumbnailSliderContainer.nativeElement.scrollWidth
            > this.thumbnailSliderContainer.nativeElement.clientWidth;
    }


    private async fetchImage(document: ImageDocument): Promise<ImageContainer> {

        const image: ImageContainer = { document: document };

        try {
            // read thumb
            let url: string = await this.imagestore.read(document.resource.id, false, true);
            image.thumbSrc = url;
        } catch (e) {
            image.thumbSrc = BlobMaker.blackImg;
            this.messages.add([M.IMAGES_ERROR_NOT_FOUND_SINGLE]);
        }

        return image;
    }


    private async addOriginal(image: ImageContainer) {

        if (!image.document) return;

        try {
            image.imgSrc = await this.imagestore.read(image.document.resource.id, false, false);
        } catch (e) {
            image.imgSrc = BlobMaker.blackImg;
            this.messages.add([M.IMAGES_ERROR_NOT_FOUND_SINGLE]);
        }
    }


    private setNextDocumentViewActiveTab() {

        const nextActiveTab = this.doceditActiveTabService.getActiveTab();
        if (['relations', 'fields'].indexOf(nextActiveTab) != -1) {
            this.activeTab = nextActiveTab;
        }
    }
}
