import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Document, FieldDocument, ImageDocument, Messages} from 'idai-components-2';
import {ImageRowItem} from '../../image/row/image-row.component';
import {ViewModalComponent} from '../view-modal.component';
import {ImageReadDatastore} from '../../../core/datastore/field/image-read-datastore';
import {RoutingService} from '../../routing-service';


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


    constructor(datastore: ImageReadDatastore,
                activeModal: NgbActiveModal,
                messages: Messages,
                router: Router,
                modalService: NgbModal,
                routingService: RoutingService) {

        super(datastore, activeModal, messages, router, modalService, routingService);
    }


    public async initialize(document: FieldDocument) {

        this.document = document;
        this.images = await this.fetchImages();
        if (this.images.length > 0) this.selectedImage = this.images[0];
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
