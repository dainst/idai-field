import {Component, DoCheck, ElementRef, ViewChild} from '@angular/core';
import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {on, is} from 'tsfun';
import {Document, FieldDocument, ImageDocument, Messages} from 'idai-components-2';
import {ImageRowItem} from '../../image/row/image-row.component';
import {ViewModalComponent} from '../view-modal.component';
import {ImageReadDatastore} from '../../../core/datastore/field/image-read-datastore';
import {RoutingService} from '../../routing-service';
import {ImagesState} from '../../../core/images/overview/view/images-state';


@Component({
    moduleId: module.id,
    templateUrl: './resource-view-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Thomas Kleinke
 */
export class ResourceViewModalComponent extends ViewModalComponent implements DoCheck {

    @ViewChild('imageInfo', { static: false }) imageInfo: ElementRef;

    public document: FieldDocument;
    public expandAllGroups: boolean = false;
    public imageInfoScrollbarVisible: boolean = false;

    private openResourceSection: string|undefined = 'stem';
    private openImageSection: string|undefined = 'stem';


    constructor(private imagesState: ImagesState,
                private datastore: ImageReadDatastore,
                activeModal: NgbActiveModal,
                messages: Messages,
                modalService: NgbModal,
                routingService: RoutingService) {

        super(activeModal, messages, modalService, routingService);
    }


    ngDoCheck() {

        this.imageInfoScrollbarVisible = this.isScrollbarVisible(this.imageInfo);
    }


    public async initialize(document: FieldDocument) {

        this.document = document;
        await this.reloadImages();
    }


    public getExpandAllGroups(isImageDocument?: boolean) {

        return isImageDocument ? this.imagesState.getExpandAllGroups() : this.expandAllGroups;
    }


    public setExpandAllGroups(expandAllGroups: boolean, isImageDocument?: boolean) {

        if (isImageDocument) {
            this.imagesState.setExpandAllGroups(expandAllGroups);
        } else {
            this.expandAllGroups = expandAllGroups;
        }
    }


    public toggleExpandAllGroups(isImageDocument?: boolean) {

        if (isImageDocument) {
            this.imagesState.setExpandAllGroups(!this.imagesState.getExpandAllGroups());
        } else {
            this.expandAllGroups = !this.expandAllGroups;
        }
    }


    public getOpenSection(isImageDocument?: boolean): string | undefined {

        return isImageDocument ? this.openImageSection : this.openResourceSection;
    }


    public setOpenSection(section: string, isImageDocument?: boolean) {

        if (isImageDocument) {
            this.openImageSection = section;
        } else {
            this.openResourceSection = section;
        }

        this.setExpandAllGroups(false, isImageDocument);
    }


    protected getDocument(isImageDocument?: boolean): Document {

        if (isImageDocument) {
            if (!this.selectedImage) throw 'No image selected';
            return this.selectedImage.document;
        } else {
            return this.document;
        }
    }


    protected async setDocument(document: FieldDocument, isImageDocument?: boolean) {

        if (isImageDocument) {
            if (!this.selectedImage) throw 'No image selected';
            this.selectedImage.document = document;
        } else {
            this.document = document;
            await this.reloadImages();
        }
    }


    private async reloadImages() {

        this.images = await this.fetchImages();

        if (this.images.length === 0) {
            this.selectedImage = undefined;
        } else if (this.selectedImage) {
            this.selectedImage = this.images.find(on('imageId', is(this.selectedImage.imageId)));
        }
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
}
