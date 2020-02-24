import {Component} from '@angular/core';
import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
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

    public document: FieldDocument;

    public expandAllGroups: boolean = false;

    private openResourceSection: string|undefined = 'stem';
    private openImageSection: string|undefined = 'stem';


    constructor(private imagesState: ImagesState,
                datastore: ImageReadDatastore,
                activeModal: NgbActiveModal,
                messages: Messages,
                modalService: NgbModal,
                routingService: RoutingService) {

        super(datastore, activeModal, messages, modalService, routingService);
    }


    public async initialize(document: FieldDocument) {

        this.document = document;
        this.images = await this.fetchImages();
        if (this.images.length > 0) this.selectedImage = this.images[0];
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


    protected getDocument(isImageDocument?: boolean) {

        return isImageDocument ? this.selectedImage.document : this.document;
    }


    protected setDocument(document: FieldDocument, isImageDocument?: boolean) {

        if (isImageDocument) {
            this.selectedImage.document = document;
        } else {
            this.document = document;
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
