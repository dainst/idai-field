import {Component} from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { on, is } from 'tsfun';
import { Datastore, Document, FieldDocument } from 'idai-field-core';
import { ViewModalComponent } from '../view-modal.component';
import { ImagesState } from '../../../components/image/overview/view/images-state';
import { ImageRowItem } from '../../image/row/image-row';
import { Routing } from '../../../services/routing';
import { Menus } from '../../../services/menus';
import { Messages } from '../../messages/messages';


@Component({
    templateUrl: './resource-view-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class ResourceViewModalComponent extends ViewModalComponent {

    public document: FieldDocument;
    public ready = false;

    private resourceEdited = false;
    private expandAllGroups = false;


    constructor(private imagesState: ImagesState,
                private datastore: Datastore,
                activeModal: NgbActiveModal,
                modalService: NgbModal,
                routingService: Routing,
                menuService: Menus,
                messages: Messages) {

        super(activeModal, modalService, routingService, menuService, messages);
    }


    public getExpandAllGroupsForMainResource = () => this.expandAllGroups;

    public setExpandAllGroupsForMainResource = (expand: boolean) => this.expandAllGroups = expand;

    public getExpandAllGroupsForImage = () => this.imagesState.getExpandAllGroups();

    public setExpandAllGroupsForImage = (expand: boolean) => this.imagesState.setExpandAllGroups(expand);


    public async initialize(document: FieldDocument) {

        this.ready = false;

        this.document = document;
        await this.reloadImages();

        this.ready = true;
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

        const images = (await this.datastore.getMultiple(
            this.document.resource.relations['isDepictedIn']
        ));

        return images.map(document => ({ imageId: document.resource.id, document }));
    }
}
