import {Component, Renderer2} from '@angular/core';
import {NgbActiveModal, NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {on, is, first, isEmpty} from 'tsfun';
import {Datastore, Document, FieldDocument, ImageDocument} from 'idai-field-core';
import {RoutingService} from '../../routing-service';
import {ImagesState} from '../../../core/images/overview/view/images-state';
import {ViewModalComponent} from '../view-modal.component';
import {ImageRowItem} from '../../../core/images/row/image-row';
import {MenuService} from '../../menu-service';
import {ImagePickerComponent} from '../../docedit/widgets/image-picker.component';
import {ImageRelationsManager} from '../../../core/model/image-relations-manager';
import {Observable} from 'rxjs/internal/Observable';
import {Observer} from 'rxjs/internal/types';


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

    public linkedDocument: Document;

    private clickEventObservers: Array<any> = [];

    public boundListenToClickEvents: () => Observable<Event>;

    public mode: 'single'|'multiple' = 'single';


    constructor(private imagesState: ImagesState,
                activeModal: NgbActiveModal,
                modalService: NgbModal,
                routingService: RoutingService,
                private renderer: Renderer2,
                menuService: MenuService,
                private datastore: Datastore,
                private imageRelationsManager: ImageRelationsManager) {

        super(activeModal, modalService, routingService, menuService);

        this.initializeClickEventListener();
        this.boundListenToClickEvents = this.listenToClickEvents.bind(this);
    }


    public getExpandAllGroups = () => this.imagesState.getExpandAllGroups();

    public setExpandAllGroups = (expand: boolean) => this.imagesState.setExpandAllGroups(expand);

    protected getDocument = () => (this.selectedImage as ImageRowItem).document;

    protected setDocument = (document: Document) => (this.selectedImage as ImageRowItem).document = document;


    public async initialize(documents?: Array<ImageDocument>,
                            selectedDocument?: ImageDocument,
                            linkedDocument?: Document) {

        this.linkedDocument = linkedDocument;
        const docs = documents ?? await this.getImageDocuments(linkedDocument?.resource.relations.isDepictedIn);
        this.images = docs.map(ImageRowItem.ofDocument);
        selectedDocument = selectedDocument ?? docs.length > 0 ? docs[0] : undefined;

        if (selectedDocument) {
            this.selectedImage = this.images.find(
                on(ImageRowItem.IMAGE_ID, is(selectedDocument.resource.id))
            );
        }
    }


    public toggleMode(mode: 'single'|'multiple') {

        this.mode = mode;
    }


    public async onContextMenuItemClicked([_, documents]: [any, Array<Document /* should be ImageDocument*/>]) {

        const document = first(documents);

        await this.imageRelationsManager.unlink(
            this.linkedDocument as FieldDocument, document as ImageDocument);

        // this.linkedDocument = await this.datastore.get(this.linkedDocument.resource.id);
        this.images = (await this.getImageDocuments(this.linkedDocument.resource.relations.isDepictedIn))
            .map(ImageRowItem.ofDocument);
        this.selectedImage =
            isEmpty(this.images)
                ? undefined
                : first(this.images);
        console.log(this.selectedImage)
    }


    public async startEditImages() {

        // this.menuService.setContext(MenuContext.DOCEDIT);

        const imagePickerModal: NgbModalRef = this.modalService.open(
            ImagePickerComponent, { size: 'lg', keyboard: false }
        );
        imagePickerModal.componentInstance.mode = 'depicts';
        imagePickerModal.componentInstance.setDocument(this.linkedDocument);

        try {
            const selectedImages: Array<ImageDocument> = await imagePickerModal.result;
            await this.imageRelationsManager.link(this.linkedDocument as FieldDocument, ...selectedImages);
            this.linkedDocument = await this.datastore.get(this.linkedDocument.resource.id);
            this.images = (await this.getImageDocuments(this.linkedDocument.resource.relations.isDepictedIn))
                .map(ImageRowItem.ofDocument);
        } catch {
            // Image picker modal has been canceled
        } finally {
            // this.menuService.setContext(MenuContext.DOCEDIT);
        }
    }


    private async getImageDocuments(relations: string[]|undefined): Promise<Array<ImageDocument>> {

        return relations
            ? (await this.datastore.getMultiple(relations)) as Array<ImageDocument>
            : [];
    }


    // TODO review duplication with resources component, also work here - and there - with observer util
    private initializeClickEventListener() {

        this.renderer.listen('document', 'click', (event: any) => {
            this.clickEventObservers.forEach(observer => observer.next(event));
        });
    }

    // TODO same
    public listenToClickEvents(): Observable<Event> {

        return new Observable((observer: Observer<Event>) => { this.clickEventObservers.push(observer); });
    }
}
