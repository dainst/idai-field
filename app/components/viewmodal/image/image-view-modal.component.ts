import {Component} from '@angular/core';
import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {on, is} from 'tsfun';
import {Messages, Document, ImageDocument} from 'idai-components-2';
import {RoutingService} from '../../routing-service';
import {ImageReadDatastore} from '../../../core/datastore/field/image-read-datastore';
import {ImagesState} from '../../../core/images/overview/view/images-state';
import {ImageRowItem} from '../../image/row/image-row.component';
import {ViewModalComponent} from '../view-modal.component';


@Component({
    moduleId: module.id,
    templateUrl: './image-view-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ImageViewModalComponent extends ViewModalComponent {

    public linkedResourceIdentifier: string|undefined;

    private openSection: string|undefined = 'stem';


    constructor(private imagesState: ImagesState,
                private datastore: ImageReadDatastore,
                activeModal: NgbActiveModal,
                messages: Messages,
                modalService: NgbModal,
                routingService: RoutingService) {

        super(activeModal, messages, modalService, routingService);
    }

    public getExpandAllGroups = () => this.imagesState.getExpandAllGroups();

    public toggleExpandAllGroups = () => this.imagesState.setExpandAllGroups(
        !this.imagesState.getExpandAllGroups()
    );

    public getOpenSection = () => this.openSection;

    protected getDocument = () => this.selectedImage.document;

    protected setDocument = (document: Document) => this.selectedImage.document = document;


    public async initialize(documents: Array<ImageDocument>, selectedDocument: ImageDocument,
                            linkedResourceIdentifier?: string) {

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
        this.imagesState.setExpandAllGroups(false);
    }
}
