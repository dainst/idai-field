import {Injectable} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {DocumentEditChangeMonitor} from 'idai-components-2/documents';
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


    constructor(
            private modalService: NgbModal,
            private doceditActiveTabService: DoceditActiveTabService,
            private documentEditChangeMonitor: DocumentEditChangeMonitor,
            private viewFacade: ViewFacade
    ) {
    }


    public async editDocument(document: Document, activeTabName?: string): Promise<any> {

        if (activeTabName) this.doceditActiveTabService.setActiveTab(activeTabName);

        const doceditRef = this.modalService.open(DoceditComponent, { size: 'lg', backdrop: 'static' });
        doceditRef.componentInstance.setDocument(document);

        const result: any = {};

        await doceditRef.result.then(
            res => this.handleSaveResult(document, result, res),
            closeReason => this.handleClosed(document, closeReason)
        );
        await this.viewFacade.populateDocumentList(); // do this in every case, since this is also the trigger for the map to get repainted with updated documents
        return result;
    }


    private async handleSaveResult(document: any, result: any, res: any) {

        result['document'] = res['document'];

        const nextActiveTab = this.doceditActiveTabService.getActiveTab();
        if (['relations','images','fields'].indexOf(nextActiveTab) != -1) {
            result['tab'] = nextActiveTab;
        }

        if (this.isDocumentListItem(document)) {
            result['updateScrollTarget'] = true;
            return this.viewFacade.setSelectedDocument(result['document'] as IdaiFieldDocument);
        }

        this.viewFacade.deselect();
        await this.viewFacade.selectMainTypeDocument(result['document'] as IdaiFieldDocument);
        await this.viewFacade.populateMainTypeDocuments()
    }


    private isDocumentListItem(document: Document) {

        return document.resource.type != this.viewFacade.getCurrentViewMainType();
    }


    private handleClosed(document: any, closeReason: any) {

        this.documentEditChangeMonitor.reset();

        if (closeReason == 'deleted') {
            this.viewFacade.deselect();

            if (!this.viewFacade.isInOverview() &&
                this.viewFacade.getSelectedMainTypeDocument() == document) {

                return this.viewFacade.handleMainTypeDocumentOnDeleted();
            }
        }
    }
}