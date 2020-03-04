import {Component, ElementRef, ViewChild} from '@angular/core';
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
export class ResourceViewModalComponent extends ViewModalComponent {

    @ViewChild('imageInfo', { static: false }) imageInfo: ElementRef;

    public document: FieldDocument;

    private resourceEdited: boolean = false;
    private expandAllGroups: boolean = false;


    constructor(private imagesState: ImagesState,
                private datastore: ImageReadDatastore,
                activeModal: NgbActiveModal,
                messages: Messages,
                modalService: NgbModal,
                routingService: RoutingService) {

        super(activeModal, messages, modalService, routingService);
    }


    public getExpandAllGroupsForMainResource = () => this.expandAllGroups;

    public setExpandAllGroupsForMainResource = (expand: boolean) => this.expandAllGroups = expand;

    public getExpandAllGroupsForImage = () => this.imagesState.getExpandAllGroups();

    public setExpandAllGroupsForImage = (expand: boolean) => this.imagesState.setExpandAllGroups(expand);


    public async initialize(document: FieldDocument) {

        this.document = document;
        await this.reloadImages();
    }


    public close() {

        this.activeModal.close(this.resourceEdited);
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
            this.resourceEdited = true;
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
