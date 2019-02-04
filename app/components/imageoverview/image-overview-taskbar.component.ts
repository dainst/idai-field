import {Component, Input} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {IdaiFieldDocument, Messages} from 'idai-components-2';
import {LinkModalComponent} from './link-modal.component';
import {RemoveLinkModalComponent} from './remove-link-modal.component';
import {ViewFacade} from '../resources/view/view-facade';
import {ImageOverviewFacade} from './view/imageoverview-facade';
import {PersistenceHelper} from './service/persistence-helper';
import {DeleteModalComponent} from './delete-modal.component';

@Component({
    selector: 'image-overview-taskbar',
    moduleId: module.id,
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

    private modalOpenend: boolean = false;

    constructor(
        public viewFacade: ViewFacade,
        private modalService: NgbModal,
        private messages: Messages,
        private imageOverviewFacade: ImageOverviewFacade,
        private persistenceHelper: PersistenceHelper
    ) {
        this.imageOverviewFacade.initialize();
    }


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && !this.modalOpenend) this.clearSelection();
    }


    public async openLinkModal() {

        this.modalOpenend = true;

        try {
            const targetDoc: IdaiFieldDocument = await this.modalService.open(
                LinkModalComponent, { keyboard: false }
            ).result;
            if (!targetDoc) return;

            try {
                await this.persistenceHelper.addRelationsToSelectedDocuments(targetDoc);
                this.imageOverviewFacade.clearSelection();
            } catch(msgWithParams) {
                this.messages.add(msgWithParams);
            }
        } catch(err) {
            // LinkModal has been canceled
        } finally {
            this.modalOpenend = false;
        }
    }


    public async openDeleteModal() {

        this.modalOpenend = true;

        const modalRef: NgbModalRef = this.modalService.open(
            DeleteModalComponent, { keyboard: false }
        );
        modalRef.componentInstance.numberOfSelectedImages = this.imageOverviewFacade.getSelected().length;

        try {
            if ((await modalRef.result) === 'delete') await this.deleteSelected();
        } catch(err) {
            // DeleteModal has been canceled
        } finally {
            this.modalOpenend = false;
        }
    }


    public async openRemoveLinkModal() {

        this.modalOpenend = true;

        try {
            await this.modalService.open(RemoveLinkModalComponent, { keyboard: false }).result;
            await this.persistenceHelper.removeRelationsOnSelectedDocuments();
            this.imageOverviewFacade.clearSelection();
            await this.imageOverviewFacade.fetchDocuments();
            this.imageGrid.calcGrid();
        } catch(err) {
            // RemoveLinkModal has been canceled
        } finally {
            this.modalOpenend = false;
        }
    }


    private async deleteSelected() {

        try {
            await this.persistenceHelper.deleteSelectedImageDocuments();
            this.imageOverviewFacade.clearSelection();
            await this.imageOverviewFacade.fetchDocuments();
        } catch(msgWithParams) {
            this.messages.add(msgWithParams);
        }
    }
}