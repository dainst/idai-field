import {Component, Input} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {IdaiFieldDocument, Messages} from 'idai-components-2';
import {LinkModalComponent} from './link-modal.component';
import {RemoveLinkModalComponent} from './remove-link-modal.component';
import {ViewFacade} from '../resources/view/view-facade';
import {MediaOverviewFacade} from './view/media-overview-facade';
import {PersistenceHelper} from './service/persistence-helper';
import {DeleteModalComponent} from './delete-modal.component';

@Component({
    selector: 'media-overview-taskbar',
    moduleId: module.id,
    templateUrl: './media-overview-taskbar.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class MediaOverviewTaskbarComponent {

    @Input() imageGrid: any;

    public getDepictsRelationsSelected = () => this.mediaOverviewFacade.getDepictsRelationsSelected();
    public clearSelection = () => this.mediaOverviewFacade.clearSelection();

    private modalOpenend: boolean = false;

    constructor(
        public viewFacade: ViewFacade,
        private modalService: NgbModal,
        private messages: Messages,
        private mediaOverviewFacade: MediaOverviewFacade,
        private persistenceHelper: PersistenceHelper
    ) {
        this.mediaOverviewFacade.initialize();
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
                this.mediaOverviewFacade.clearSelection();
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
        modalRef.componentInstance.numberOfSelectedImages
            = this.mediaOverviewFacade.getSelected().length;

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
            this.mediaOverviewFacade.clearSelection();
            await this.mediaOverviewFacade.fetchDocuments();
            this.imageGrid.calcGrid();
        } catch(err) {
            // RemoveLinkModal has been canceled
        } finally {
            this.modalOpenend = false;
        }
    }


    private async deleteSelected() {

        await this.persistenceHelper.deleteSelectedMediaDocuments();

        this.mediaOverviewFacade.clearSelection();
        await this.mediaOverviewFacade.fetchDocuments();
    }
}