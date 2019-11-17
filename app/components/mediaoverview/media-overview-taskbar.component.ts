import {Component, Input} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {FieldDocument, Messages} from 'idai-components-2';
import {LinkModalComponent} from './link-modal.component';
import {RemoveLinkModalComponent} from './remove-link-modal.component';
import {ViewFacade} from '../resources/view/view-facade';
import {MediaOverviewFacade} from './view/media-overview-facade';
import {PersistenceHelper} from './service/persistence-helper';
import {DeleteModalComponent} from './delete-modal.component';
import {MediaOverviewComponent} from './media-overview.component';


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


    constructor(
        public viewFacade: ViewFacade,
        private modalService: NgbModal,
        private messages: Messages,
        private mediaOverviewFacade: MediaOverviewFacade,
        private persistenceHelper: PersistenceHelper,
        private mediaOverviewComponent: MediaOverviewComponent
    ) {}


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && !this.mediaOverviewComponent.modalOpened) this.clearSelection();
    }


    public async openLinkModal() {

        this.mediaOverviewComponent.modalOpened = true;

        try {
            const modalRef: NgbModalRef = this.modalService.open(
                LinkModalComponent, { keyboard: false }
            );
            modalRef.componentInstance.initializeFilterOptions();

            const targetDocument: FieldDocument = await modalRef.result;
            if (!targetDocument) return;

            try {
                await this.persistenceHelper.addDepictsRelationsToSelectedDocuments(targetDocument);
                this.mediaOverviewFacade.clearSelection();
            } catch(msgWithParams) {
                this.messages.add(msgWithParams);
            }
        } catch(err) {
            // LinkModal has been canceled
        } finally {
            this.mediaOverviewComponent.modalOpened = false;
        }
    }


    public async openDeleteModal() {

        this.mediaOverviewComponent.modalOpened = true;

        const modalRef: NgbModalRef = this.modalService.open(
            DeleteModalComponent, { keyboard: false }
        );
        modalRef.componentInstance.numberOfSelectedMediaResources
            = this.mediaOverviewFacade.getSelected().length;

        try {
            if ((await modalRef.result) === 'delete') await this.deleteSelected();
        } catch(err) {
            // DeleteModal has been canceled
        } finally {
            this.mediaOverviewComponent.modalOpened = false;
        }
    }


    public async openRemoveLinkModal() {

        this.mediaOverviewComponent.modalOpened = true;

        try {
            await this.modalService.open(RemoveLinkModalComponent, { keyboard: false }).result;
            await this.persistenceHelper.removeDepictsRelationsOnSelectedDocuments();
            this.mediaOverviewFacade.clearSelection();
            await this.mediaOverviewFacade.fetchDocuments();
            this.imageGrid.calcGrid();
        } catch(err) {
            // RemoveLinkModal has been canceled
        } finally {
            this.mediaOverviewComponent.modalOpened = false;
        }
    }


    private async deleteSelected() {

        try {
            await this.persistenceHelper.deleteSelectedMediaDocuments();
            this.mediaOverviewFacade.clearSelection();
            await this.mediaOverviewFacade.fetchDocuments();
        } catch(msgWithParams) {
            this.messages.add(msgWithParams);
        }
    }
}