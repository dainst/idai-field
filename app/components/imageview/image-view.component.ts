import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {isEmpty} from 'tsfun';
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

    public image: ImageContainer = {};
    public activeTab: string;
    public originalNotFound: boolean = false;


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


    public jumpToResource = (documentToJumpTo: FieldDocument) => this.routingService.jumpToResource(
        documentToJumpTo, undefined);


    ngOnInit() {

        window.getSelection().removeAllRanges();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') await this.activeModal.close();
    }


    public async setDocument(document: ImageDocument) {

        await this.fetchImage(document);
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
        doceditModalComponent.setDocument(this.image.document);

        try {
            const result = await doceditModalRef.result;
            if (result.document) this.image.document = result.document;
            this.setNextDocumentViewActiveTab();
        } catch (closeReason) {
            if (closeReason === 'deleted') await this.activeModal.close();
        }

        MenuService.setContext('default');
    }


    public hasRelations() {

        if (!this.image) return false;
        if (!this.image.document) return false;

        const relations: any = this.image.document.resource.relations;
        if (isEmpty(relations)) return false;

        return Object.keys(relations).filter(name => relations[name].length > 0).length > 0;
    }


    private async fetchImage(document: ImageDocument) {

        if (!this.imagestore.getPath()) this.messages.add([M.IMAGESTORE_ERROR_INVALID_PATH_READ]);

        this.image.document = document;

        try {
            // read original (empty if not present)
            let url = await this.imagestore.read(document.resource.id, false, false);
            if (!url || url == '') this.originalNotFound = true;
            this.image.imgSrc = url;

            // read thumb
            url = await this.imagestore.read(document.resource.id, false, true);
            this.image.thumbSrc = url;
        } catch (e) {
            this.image.imgSrc = BlobMaker.blackImg;
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
