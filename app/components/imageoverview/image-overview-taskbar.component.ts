import {Component, Input} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Messages} from 'idai-components-2/messages';
import {LinkModalComponent} from './link-modal.component';
import {RemoveLinkModalComponent} from './remove-link-modal.component';
import {ViewFacade} from '../resources/view/view-facade';
import {ImageOverviewFacade} from './view/imageoverview-facade';
import {PersistenceHelper} from './service/persistence-helper';

@Component({
    selector: 'image-overview-taskbar',
    moduleId: module.id,
    templateUrl: './image-overview-taskbar.html'
})
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class ImageOverviewTaskbarComponent {

    @Input() imageGrid: any;

    public getSelected = () => this.imageOverviewFacade.getSelected();
    public getDepictsRelationsSelected = () => this.imageOverviewFacade.getDepictsRelationsSelected();

    constructor(
        public viewFacade: ViewFacade,
        private modalService: NgbModal,
        private messages: Messages,
        private imageOverviewFacade: ImageOverviewFacade,
        private persistenceHelper: PersistenceHelper
    ) {
        this.imageOverviewFacade.initialize();
    }


    public async openLinkModal() {

        try {
            const targetDoc: IdaiFieldDocument = await this.modalService.open(LinkModalComponent).result;
            if (!targetDoc) return;

            try {
                await this.persistenceHelper.addRelationsToSelectedDocuments(targetDoc);
                this.imageOverviewFacade.clearSelection();
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
            this.imageOverviewFacade.clearSelection();
            await this.imageOverviewFacade.fetchDocuments();
            this.imageGrid.calcGrid();
        } catch (e) {
            // do nothing on dismiss
        }
    }


    private async deleteSelected() {

        await this.persistenceHelper.deleteSelectedImageDocuments();

        this.imageOverviewFacade.clearSelection();
        this.imageOverviewFacade.fetchDocuments();
    }
}