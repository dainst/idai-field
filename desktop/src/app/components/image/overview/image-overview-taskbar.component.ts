import { Component, Input } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { FieldDocument } from 'idai-field-core';
import { LinkModalComponent } from './link-modal.component';
import { RemoveLinkModalComponent } from './remove-link-modal.component';
import { ImageOverviewFacade } from '../../../components/image/overview/view/imageoverview-facade';
import { DeleteModalComponent } from './deletion/delete-modal.component';
import { ViewFacade } from '../../../components/resources/view/view-facade';
import { M } from '../../messages/m';
import { Messages } from '../../messages/messages';
import { MenuContext } from '../../../services/menu-context';
import { Menus } from '../../../services/menus';
import { ImageRelationsManager, ImageRelationsManagerErrors } from '../../../services/image-relations-manager';
import { DeletionInProgressModalComponent } from './deletion/deletion-in-progress-modal.component';
import { AngularUtility } from '../../../angular/angular-utility';
import { SavingChangesModal } from '../../widgets/saving-changes-modal.component';


@Component({
    selector: 'image-overview-taskbar',
    templateUrl: './image-overview-taskbar.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class ImageOverviewTaskbarComponent {

    @Input() imageGrid: any;

    public getDepictsRelationsSelected = () => this.imageOverviewFacade.getDepictsRelationsSelected();
    public clearSelection = () => this.imageOverviewFacade.clearSelection();


    constructor(public viewFacade: ViewFacade,
                private modalService: NgbModal,
                private messages: Messages,
                private imageOverviewFacade: ImageOverviewFacade,
                private imageRelationsManager: ImageRelationsManager,
                private menuService: Menus) {}


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.DEFAULT) {
            this.clearSelection();
        }
    }


    public async openLinkModal() {

        this.menuService.setContext(MenuContext.MODAL);

        try {
            const modalRef: NgbModalRef = this.modalService.open(
                LinkModalComponent, { keyboard: false }
            );
            modalRef.componentInstance.imageDocuments = this.imageOverviewFacade.getSelected();
            modalRef.componentInstance.initializeFilterOptions();

            const targetDocument: FieldDocument = await modalRef.result;
            if (!targetDocument) return;

            await this.addLinks(targetDocument);
        } catch (err) {
            // LinkModal has been canceled
        } finally {
            this.menuService.setContext(MenuContext.DEFAULT);
            AngularUtility.blurActiveElement();
        }
    }


    public async openDeleteModal() {

        this.menuService.setContext(MenuContext.MODAL);

        const modalRef: NgbModalRef = this.modalService.open(
            DeleteModalComponent, { keyboard: false }
        );
        modalRef.componentInstance.numberOfSelectedImages = this.imageOverviewFacade.getSelected().length;

        try {
            if ((await modalRef.result) === 'delete') await this.deleteSelected();
        } catch(err) {
            // DeleteModal has been canceled
        } finally {
            this.menuService.setContext(MenuContext.DEFAULT);
            AngularUtility.blurActiveElement();
        }
    }


    public async openRemoveLinkModal() {

        this.menuService.setContext(MenuContext.MODAL);

        try {
            await this.modalService.open(RemoveLinkModalComponent, { keyboard: false }).result;
            await this.removeLinks();
        } catch(err) {
            // RemoveLinkModal has been canceled
        } finally {
            this.menuService.setContext(MenuContext.DEFAULT);
            AngularUtility.blurActiveElement();
        }
    }


    private async deleteSelected() {

        const deletionInProgressModalRef: NgbModalRef = this.modalService.open(
            DeletionInProgressModalComponent, { backdrop: 'static', keyboard: false }
        );
        deletionInProgressModalRef.componentInstance.multiple = this.imageOverviewFacade.getSelected().length > 1;

        try {
            await this.deleteSelectedImageDocuments();
            this.imageOverviewFacade.clearSelection();
            await this.imageOverviewFacade.fetchDocuments();
        } catch (msgWithParams) {
            let m = msgWithParams;
            if (msgWithParams.length > 0) {
                if (msgWithParams[0] === ImageRelationsManagerErrors.IMAGESTORE_ERROR_DELETE) {
                    m = [M.IMAGESTORE_ERROR_DELETE];
                }
                if (msgWithParams[0] === ImageRelationsManagerErrors.IMAGESTORE_ERROR_INVALID_PATH_DELETE) {
                    m = [M.IMAGESTORE_ERROR_INVALID_PATH_DELETE];
                }
            }
            this.messages.add(m);
        } finally {
            deletionInProgressModalRef.close();
        }
    }


    private async deleteSelectedImageDocuments() {

        await this.imageRelationsManager.remove(this.imageOverviewFacade.getSelected());

        for (let document of this.imageOverviewFacade.getSelected()) {
            this.imageOverviewFacade.remove(document);
        }
    }


    private async addLinks(targetDocument: FieldDocument) {

        const savingChangesModal = this.modalService.open(
            SavingChangesModal, { backdrop: 'static', keyboard: false }
        );

        AngularUtility.blurActiveElement();

        try {
            await this.addDepictsRelationsToSelectedDocuments(targetDocument);
            this.imageOverviewFacade.clearSelection();
        } catch (msgWithParams) {
            this.messages.add(msgWithParams);
        } finally {
            savingChangesModal.close();
        }
    }


    private async removeLinks() {

        const savingChangesModal = this.modalService.open(
            SavingChangesModal, { backdrop: 'static', keyboard: false }
        );

        AngularUtility.blurActiveElement();

        try {
            await this.removeDepictsRelationsOnSelectedDocuments();
            this.imageOverviewFacade.clearSelection();
            await this.imageOverviewFacade.fetchDocuments();
            this.imageGrid.calcGrid();
        } catch (msgWithParams) {
            this.messages.add(msgWithParams);
        } finally {
            savingChangesModal.close();
        }
    }


    private async addDepictsRelationsToSelectedDocuments(targetDocument: FieldDocument) {

        await this.imageRelationsManager
            .link(targetDocument, ...this.imageOverviewFacade.getSelected());
    }


    private async removeDepictsRelationsOnSelectedDocuments() {

        await this.imageRelationsManager
            .unlink(...this.imageOverviewFacade.getSelected());
    }
}
