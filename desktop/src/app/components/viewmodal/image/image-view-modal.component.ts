import {Component} from '@angular/core';
import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {on, is} from 'tsfun';
import {ImageDocument} from 'idai-field-core';
import {Document} from 'idai-components-2';
import {RoutingService} from '../../routing-service';
import {ImageReadDatastore} from '../../../core/datastore/field/image-read-datastore';
import {ImagesState} from '../../../core/images/overview/view/images-state';
import {ViewModalComponent} from '../view-modal.component';
import {Messages} from '../../messages/messages';
import {ImageRowItem} from '../../../core/images/row/image-row';
import {MenuService} from '../../menu-service';


@Component({
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


    constructor(private imagesState: ImagesState,
                private datastore: ImageReadDatastore,
                activeModal: NgbActiveModal,
                messages: Messages,
                modalService: NgbModal,
                routingService: RoutingService,
                menuService: MenuService) {

        super(activeModal, messages, modalService, routingService, menuService);
    }


    public getExpandAllGroups = () => this.imagesState.getExpandAllGroups();

    public setExpandAllGroups = (expand: boolean) => this.imagesState.setExpandAllGroups(expand);

    protected getDocument = () => (this.selectedImage as ImageRowItem).document;

    protected setDocument = (document: Document) => (this.selectedImage as ImageRowItem).document = document;


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
}
