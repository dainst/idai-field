import {Injectable} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Document, NewDocument, IdaiFieldDocument} from 'idai-components-2';
import {DoceditComponent} from '../../docedit/docedit.component';
import {DoceditActiveTabService} from '../../docedit/docedit-active-tab-service';
import {ViewFacade} from '../view/view-facade';

@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class DoceditLauncher {

    public isDoceditModalOpened: boolean = false;


    constructor(
            private modalService: NgbModal,
            private doceditActiveTabService: DoceditActiveTabService,
            private viewFacade: ViewFacade
    ) {}


    public async editDocument(document: Document|NewDocument,
                              activeTabName?: string): Promise<IdaiFieldDocument|undefined> {

        this.isDoceditModalOpened = true;

        if (activeTabName) this.doceditActiveTabService.setActiveTab(activeTabName);

        const doceditRef = this.modalService.open(DoceditComponent,
            { size: 'lg', backdrop: 'static', keyboard: false });
        doceditRef.componentInstance.setDocument(document);

        let result: IdaiFieldDocument|undefined;

        try {
            result = (await doceditRef.result)['document'];
            await this.handleSaveResult(result as IdaiFieldDocument);
        } catch(closeReason) {
            await this.handleClosed(closeReason);
        } finally {
            this.isDoceditModalOpened = false;
        }

        return result;
    }


    private async handleSaveResult(document: IdaiFieldDocument) {

        const nextActiveTab = this.doceditActiveTabService.getActiveTab();
        if (['relations','images','fields'].indexOf(nextActiveTab) != -1) {
            this.viewFacade.setActiveDocumentViewTab(nextActiveTab);
        }

        await this.viewFacade.populateDocumentList();
        await this.viewFacade.setSelectedDocument(document.resource.id);
    }


    private async handleClosed(closeReason: string) {

        if (closeReason === 'deleted') {
            this.viewFacade.deselect();
            await this.viewFacade.rebuildNavigationPath();
            await this.viewFacade.populateDocumentList();
        } else if (closeReason === 'cancel') {
            this.viewFacade.removeNewDocument();
        }
    }
}