import {Component, Input} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {IdaiFieldDocument, Messages} from 'idai-components-2';
import {LinkModalComponent} from './link-modal.component';
import {RemoveLinkModalComponent} from './remove-link-modal.component';
import {ViewFacade} from '../resources/view/view-facade';
import {MediaOverviewFacade} from './view/media-overview-facade';
import {PersistenceHelper} from './service/persistence-helper';

@Component({
    selector: 'media-overview-taskbar',
    moduleId: module.id,
    templateUrl: './media-overview-taskbar.html'
})
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class MediaOverviewTaskbarComponent {

    @Input() imageGrid: any;

    public getSelected = () => this.mediaOverviewFacade.getSelected();
    public getDepictsRelationsSelected = () => this.mediaOverviewFacade.getDepictsRelationsSelected();
    public clearSelection = () => this.mediaOverviewFacade.clearSelection();

    constructor(
        public viewFacade: ViewFacade,
        private modalService: NgbModal,
        private messages: Messages,
        private mediaOverviewFacade: MediaOverviewFacade,
        private persistenceHelper: PersistenceHelper
    ) {
        this.mediaOverviewFacade.initialize();
    }


    public async openLinkModal() {

        try {
            const targetDoc: IdaiFieldDocument = await this.modalService.open(LinkModalComponent).result;
            if (!targetDoc) return;

            try {
                await this.persistenceHelper.addRelationsToSelectedDocuments(targetDoc);
                this.mediaOverviewFacade.clearSelection();
            } catch(msgWithParams) {
                this.messages.add(msgWithParams);
            }
        } catch (e) {
            // do nothing on dismiss
        }
    }


    public async openDeleteModal(modal: any) {

        if (await this.modalService.open(modal).result == 'delete') this.deleteSelected();
    }


    public async openRemoveLinkModal() {

        try {
            await this.modalService.open(RemoveLinkModalComponent).result;
            await this.persistenceHelper.removeRelationsOnSelectedDocuments();
            this.mediaOverviewFacade.clearSelection();
            await this.mediaOverviewFacade.fetchDocuments();
            this.imageGrid.calcGrid();
        } catch (e) {
            // do nothing on dismiss
        }
    }


    private async deleteSelected() {

        await this.persistenceHelper.deleteSelectedMediaDocuments();

        this.mediaOverviewFacade.clearSelection();
        this.mediaOverviewFacade.fetchDocuments();
    }
}