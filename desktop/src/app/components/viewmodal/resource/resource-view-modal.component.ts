import {Component} from '@angular/core';
import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {on, is} from 'tsfun';
import {Datastore, Document} from 'idai-field-core';
import {FieldDocument, ImageDocument} from 'idai-field-core'
import {ViewModalComponent} from '../view-modal.component';
import {RoutingService} from '../../routing-service';
import {ImagesState} from '../../../core/images/overview/view/images-state';
import {ImageRowItem} from '../../../core/images/row/image-row';
import {MenuService} from '../../menu-service';


@Component({
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
    public ready: boolean = false;

    private resourceEdited: boolean = false;
    private expandAllGroups: boolean = false;


    constructor(private imagesState: ImagesState,
                private datastore: Datastore,
                activeModal: NgbActiveModal,
                modalService: NgbModal,
                routingService: RoutingService,
                menuService: MenuService) {

        super(activeModal, modalService, routingService, menuService);
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
        )) as Array<ImageDocument>;

        return images.map((document: ImageDocument) => {
            return { imageId: document.resource.id, document: document }
        });
    }
}
