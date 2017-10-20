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
export class DoceditProxy {


    constructor(
            private modalService: NgbModal,
            private doceditActiveTabService: DoceditActiveTabService,
            private documentEditChangeMonitor: DocumentEditChangeMonitor,
            private viewFacade: ViewFacade
    ) {
    }


    public editDocument(document: Document, activeTabName?: string): Promise<any> {

        if (activeTabName) this.doceditActiveTabService.setActiveTab(activeTabName);

        const doceditRef = this.modalService.open(DoceditComponent, { size: 'lg', backdrop: 'static' });
        doceditRef.componentInstance.setDocument(document);

        const result: any = {};

        return doceditRef.result.then(
            res => this.handleSaveResult(document, result, res),
            closeReason => this.handleClosed(document, closeReason)
        )
        .then(() => this.viewFacade.populateDocumentList()) // do this in every case, since this is also the trigger for the map to get repainted with updated documents
        .then(() => {return result; });
    }


    private handleSaveResult(document, result, res) {

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
        this.viewFacade.selectOperationTypeDocument(result['document'] as IdaiFieldDocument);
        return this.viewFacade.populateOperationTypeDocuments();
    }


    private isDocumentListItem(document: Document) {

        return document.resource.type != this.viewFacade.getMainType();
    }


    private handleClosed(document, closeReason) {

        this.documentEditChangeMonitor.reset();

        if (closeReason == 'deleted') {
            this.viewFacade.deselect(); // replacement for: this.documentsManager.selectedDocument = undefined;
            if (document == this.viewFacade.getSelectedOperationTypeDocument()) {
                return this.viewFacade.handleMainTypeDocumentOnDeleted(this.viewFacade.getSelectedDocument());
            }
        }
    }
}