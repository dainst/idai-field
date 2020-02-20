import {Component, DoCheck, ElementRef, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Messages, Document, FieldDocument, ImageDocument} from 'idai-components-2';
import {DoceditComponent} from '../../docedit/docedit.component';
import {RoutingService} from '../../routing-service';
import {ImageReadDatastore} from '../../../core/datastore/field/image-read-datastore';
import {MenuService} from '../../../desktop/menu-service';
import {ImageRowItem} from '../../image/row/image-row.component';


@Component({
    moduleId: module.id,
    templateUrl: './resource-view.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Thomas Kleinke
 */
export class ResourceViewComponent implements DoCheck {

    @ViewChild('resourceInfo', { static: false }) resourceInfo: ElementRef;

    public document: FieldDocument;

    public openSection: string|undefined = 'stem';
    public expandAllGroups: boolean = false;
    public resourceInfoScrollbarVisible: boolean = false;

    private images: Array<ImageRowItem> = [];
    private selectedImage: ImageRowItem;

    private subModalOpened: boolean = false;


    constructor(private activeModal: NgbActiveModal,
                private datastore: ImageReadDatastore,
                private messages: Messages,
                private router: Router,
                private modalService: NgbModal,
                private routingService: RoutingService) {}


    ngDoCheck() {

        this.resourceInfoScrollbarVisible = this.isResourceInfoScrollbarVisible();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && !this.subModalOpened) await this.activeModal.close();
    }


    public async onSelected(selectedImage: ImageRowItem) {

        this.selectedImage = selectedImage;
    }


    public async initialize(document: FieldDocument) {

        this.document = document;
        this.images = await this.fetchImages();
        if (this.images.length > 0) this.selectedImage = this.images[0];
    }


    public setOpenSection(section: string) {

        this.openSection = section;
        this.expandAllGroups = false;
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
        doceditModalComponent.setDocument(this.document);

        try {
            const result = await doceditModalRef.result;
            if (result.document) this.selectedImage.document = result.document;
        } catch (closeReason) {
            if (closeReason === 'deleted') await this.activeModal.close();
        }

        this.subModalOpened = false;
        MenuService.setContext('image-view');
    }


    public async jumpToResource(documentToJumpTo: FieldDocument) {

        await this.routingService.jumpToResource(documentToJumpTo, true);
        this.activeModal.close();
    }


    private async fetchImages(): Promise<Array<ImageRowItem>> {

        if (!Document.hasRelations(this.document, 'isDepictedIn')) return [];

        const images: Array<ImageDocument> = await this.datastore.getMultiple(
            this.document.resource.relations['isDepictedIn']
        );

        return images.map((document: ImageDocument) => {
            return { imageId: document.resource.id, document: document }
        });
    }


    private isResourceInfoScrollbarVisible(): boolean {

        return this.resourceInfo
            && this.resourceInfo.nativeElement.scrollHeight
            > this.resourceInfo.nativeElement.clientHeight;
    }
}
