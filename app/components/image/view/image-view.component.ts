import {Component, DoCheck, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {on, is} from 'tsfun';
import {Messages, FieldDocument, ImageDocument} from 'idai-components-2';
import {DoceditComponent} from '../../docedit/docedit.component';
import {RoutingService} from '../../routing-service';
import {ImageReadDatastore} from '../../../core/datastore/field/image-read-datastore';
import {M} from '../../messages/m';
import {MenuService} from '../../../desktop/menu-service';
import {ImagesState} from '../../../core/images/overview/view/images-state';
import {showMissingImageMessageOnConsole, showMissingOriginalImageMessageOnConsole} from '../log-messages';
import {ImageContainer} from '../../../core/images/imagestore/image-container';
import {BlobMaker} from '../../../core/images/imagestore/blob-maker';
import {Imagestore} from '../../../core/images/imagestore/imagestore';
import {ImageRowItem} from '../row/image-row.component';


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
export class ImageViewComponent implements OnInit, DoCheck {

    @ViewChild('thumbnailSliderContainer', { static: false }) thumbnailSliderContainer: ElementRef;
    @ViewChild('imageInfo', { static: false }) imageInfo: ElementRef;

    public images: Array<ImageRowItem> = [];
    public selectedImage: ImageRowItem;

    public imageContainer: ImageContainer;
    public linkedResourceIdentifier: string|undefined;
    public openSection: string|undefined = 'stem';

    public thumbnailSliderScrollbarVisible: boolean = false;
    public imageInfoScrollbarVisible: boolean = false;

    private subModalOpened: boolean = false;


    constructor(
        private activeModal: NgbActiveModal,
        private datastore: ImageReadDatastore,
        private imagestore: Imagestore,
        private messages: Messages,
        private router: Router,
        private modalService: NgbModal,
        private routingService: RoutingService,
        private imagesState: ImagesState
    ) {}


    public toggleExpandAllGroups = () => this.imagesState.setExpandAllGroups(
        !this.imagesState.getExpandAllGroups()
    );


    public getExpandAllGroups = () => this.imagesState.getExpandAllGroups();


    ngOnInit() {

        (window.getSelection() as any).removeAllRanges();
    }


    ngDoCheck() {

        this.thumbnailSliderScrollbarVisible = this.isThumbnailSliderScrollbarVisible();
        this.imageInfoScrollbarVisible = this.isImageInfoScrollbarVisible();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && !this.subModalOpened) await this.activeModal.close();
    }


    public async onSelected(imageRowItem: ImageRowItem) {

        this.imageContainer = await this.loadImage(imageRowItem.document as ImageDocument);
    }


    public async initialize(documents: Array<ImageDocument>, selectedDocument: ImageDocument,
                            linkedResourceIdentifier?: string) {

        if (!this.imagestore.getPath()) this.messages.add([M.IMAGESTORE_ERROR_INVALID_PATH_READ]);

        this.linkedResourceIdentifier = linkedResourceIdentifier;

        this.images = documents.map(document => {
            return { imageId: document.resource.id, document: document };
        });

        this.selectedImage = this.images.find(
            on('imageId', is(selectedDocument.resource.id))
        ) as ImageRowItem;
    }


    public setOpenSection(section: string) {

        this.openSection = section;
        if (this.getExpandAllGroups()) this.toggleExpandAllGroups();
    }


    public close() {

        this.activeModal.close();
    }


    public async startEdit() {

        this.subModalOpened = true;
        MenuService.setContext('docedit');

        const doceditModalRef = this.modalService.open(
            DoceditComponent,
            { size: 'lg', backdrop: 'static' }
            );
        const doceditModalComponent = doceditModalRef.componentInstance;
        doceditModalComponent.setDocument(this.imageContainer.document as ImageDocument);

        try {
            const result = await doceditModalRef.result;
            if (result.document) this.imageContainer.document = result.document;
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


    public containsOriginal(image: ImageContainer): boolean {

        return image.imgSrc !== undefined && image.imgSrc !== '';
    }


    private isThumbnailSliderScrollbarVisible(): boolean {

        return this.thumbnailSliderContainer
            && this.thumbnailSliderContainer.nativeElement.scrollWidth
            > this.thumbnailSliderContainer.nativeElement.clientWidth;
    }


    private isImageInfoScrollbarVisible(): boolean {

        return this.imageInfo
            && this.imageInfo.nativeElement.scrollHeight
            > this.imageInfo.nativeElement.clientHeight;
    }


    private async loadImage(document: ImageDocument): Promise<ImageContainer> {

        const image: ImageContainer = { document: document };

        try {
            image.imgSrc = await this.imagestore.read(
                document.resource.id, false, false
            );
        } catch (e) {
            image.imgSrc = BlobMaker.blackImg;
        }

        try {
            image.thumbSrc = await this.imagestore.read(
                document.resource.id, false, true
            );
        } catch (e) {
            image.thumbSrc = BlobMaker.blackImg;
        }

        this.showConsoleErrorIfImageIsMissing(image);

        return image;
    }


    private showConsoleErrorIfImageIsMissing(image: ImageContainer) {

        if (this.containsOriginal(image)) return;

        const name: string = image.document && image.document.resource
            ? image.document.resource.id
            : 'unknown';

        if (image.thumbSrc === BlobMaker.blackImg) {
            showMissingImageMessageOnConsole(name);
        } else {
            showMissingOriginalImageMessageOnConsole(name);
        }
    }
}
