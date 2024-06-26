import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { on, is, first, isEmpty } from 'tsfun';
import { Datastore, Document, FieldDocument, ImageDocument, Relation } from 'idai-field-core';
import { ImagesState } from '../../../components/image/overview/view/images-state';
import { ViewModalComponent } from '../view-modal.component';
import { ImageRowItem } from '../../image/row/image-row';
import { ImagePickerComponent} from '../../docedit/widgets/image-picker.component';
import { ImageRelationsManager } from '../../../services/image-relations-manager';
import { Menus } from '../../../services/menus';
import { Routing } from '../../../services/routing';
import { Messages } from '../../messages/messages';
import { SavingChangesModal } from '../../widgets/saving-changes-modal.component';


export namespace ImageViewModalComponent {

    export type Mode = 'view'|'edit';
}


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
    public mode: ImageViewModalComponent.Mode = 'view';

    public selected: Array<ImageDocument> = [];


    constructor(private imagesState: ImagesState,
                activeModal: NgbActiveModal,
                modalService: NgbModal,
                routingService: Routing,
                menuService: Menus,
                messages: Messages,
                private datastore: Datastore,
                private imageRelationsManager: ImageRelationsManager) {

        super(activeModal, modalService, routingService, menuService, messages);
    }


    public getExpandAllGroups = () => this.imagesState.getExpandAllGroups();

    public setExpandAllGroups = (expand: boolean) => this.imagesState.setExpandAllGroups(expand);

    public isEditingAllowed = () => this.linkedDocument && !this.linkedDocument.project;

    protected getDocument = () => (this.selectedImage as ImageRowItem).document;

    protected setDocument = (document: Document) => (this.selectedImage as ImageRowItem).document = document;


    public onImagesUploaded(event: any) {

        this.loadImages();
    }


    public isActive(mode: ImageViewModalComponent.Mode) {

        return this.mode === mode;
    }


    public isMainImage(imageDocument: ImageDocument): boolean {

        return imageDocument.resource.id === this.linkedDocument.resource.relations[Relation.Image.ISDEPICTEDIN]?.[0];
    }


    public async setMainImage() {

        if (this.selected.length !== 1) return;

        const savingChangesModal = this.modalService.open(
            SavingChangesModal, { backdrop: 'static', keyboard: false, animation: false }
        );

        try {
            await this.changeMainImage();
        } catch (msgWithParams) {
            this.messages.add(msgWithParams);
        } finally {
            savingChangesModal.close();
        }
    }


    public async initialize(linkedDocument: Document) {

        this.linkedDocument = linkedDocument;
        const docs = await this.getImageDocuments(linkedDocument?.resource.relations.isDepictedIn);
        this.images = docs.map(ImageRowItem.ofDocument);
        const selectedDocument = docs.length > 0 ? docs[0] : undefined;

        if (selectedDocument) {
            this.selectedImage = this.images.find(
                on(ImageRowItem.IMAGE_ID, is(selectedDocument.resource.id))
            );
        }
    }


    public async initializeWithoutLinkedDocument(imageDocument: ImageDocument,
                                                 imageDocuments: Array<ImageDocument>) {

        this.images = imageDocuments.map(ImageRowItem.ofDocument);
        this.selectedImage = this.images.find(
            on(ImageRowItem.IMAGE_ID, is(imageDocument.resource.id))
        );
    }


    public setMode(mode: ImageViewModalComponent.Mode) {

        this.mode = mode;
    }


    public async removeLinks() {

        const savingChangesModal = this.modalService.open(
            SavingChangesModal, { backdrop: 'static', keyboard: false, animation: false }
        );

        try {
            await this.removeImageLinks(this.selected);
            this.selected = [];
        } catch (msgWithParams) {
            this.messages.add(msgWithParams);
        } finally {
            savingChangesModal.close();
        }
    }


    public getRemoveLinksTooltip(): string {

        return this.selected.length === 1
            ? $localize `:@@docedit.tabs.images.tooltips.removeLink:Verknüpfung löschen`
            : $localize `:@@docedit.tabs.images.tooltips.removeLinks:Verknüpfungen löschen`;
    }


    public clearSelection() {

        this.selected = [];
    }


    public async startEditImages() {

        const imagePickerModal = this.modalService.open(
            ImagePickerComponent, { size: 'lg', keyboard: false, animation: false }
        );
        imagePickerModal.componentInstance.mode = 'depicts';
        imagePickerModal.componentInstance.setDocument(this.linkedDocument);

        try {
            await this.saveChanges(await imagePickerModal.result);
        } catch {
            // modal cancelled
        }
    }


    private async saveChanges(selectedImages: Array<ImageDocument>) {

        const savingChangesModal = this.modalService.open(
            SavingChangesModal, { backdrop: 'static', keyboard: false, animation: false }
        );

        try {
            await this.imageRelationsManager.link(this.linkedDocument as FieldDocument, ...selectedImages);
            this.linkedDocument = await this.datastore.get(this.linkedDocument.resource.id);
            this.images = (await this.getImageDocuments(this.linkedDocument.resource.relations.isDepictedIn))
                .map(ImageRowItem.ofDocument);
        } catch (msgWithParams) {
            this.messages.add(msgWithParams);
        } finally {
            savingChangesModal.close();
        }
    }


    private async changeMainImage() {

        const mainImageId: string = this.selected[0].resource.id;

        this.linkedDocument.resource.relations[Relation.Image.ISDEPICTEDIN] = [mainImageId].concat(
            this.linkedDocument.resource.relations[Relation.Image.ISDEPICTEDIN].filter(targetId => {
                return targetId !== mainImageId;
            })
        );

        this.linkedDocument = await this.datastore.update(this.linkedDocument);
        this.loadImages();
    }


    private async removeImageLinks(documents: Array<ImageDocument>) {

        await this.imageRelationsManager.unlink(
            this.linkedDocument as FieldDocument, ...documents
        );

        await this.loadImages();
    }


    private async loadImages() {

        this.images = (await this.getImageDocuments(this.linkedDocument.resource.relations.isDepictedIn))
            .map(ImageRowItem.ofDocument);
        this.selectedImage = isEmpty(this.images)
            ? undefined
            : first(this.images);
        this.selected = [];
    }


    private async getImageDocuments(relations: string[]|undefined): Promise<Array<ImageDocument>> {

        return relations
            ? (await this.datastore.getMultiple(relations)) as Array<ImageDocument>
            : [];
    }
}
