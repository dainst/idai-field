import {Injectable} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {DocumentEditChangeMonitor} from 'idai-components-2/documents';
import {DoceditComponent} from '../../docedit/docedit.component';
import {DoceditActiveTabService} from '../../docedit/docedit-active-tab-service';
import {DocumentsManager} from './documents-manager';
import {MainTypeManager} from './main-type-manager';
import {ViewManager} from './view-manager';

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
            private documentsManager: DocumentsManager,
            private mainTypeManager: MainTypeManager,
            private viewManager: ViewManager
    ) {
    }


    public editDocument(document: Document, activeTabName?: string): Promise<any> {

        if (activeTabName) this.doceditActiveTabService.setActiveTab(activeTabName);

        const doceditRef = this.modalService.open(DoceditComponent, { size: 'lg', backdrop: 'static' });
        doceditRef.componentInstance.setDocument(document);

        const result: any = {};

        return doceditRef.result.then(res => {

            result['document'] = res['document'];

            const nextActiveTab = this.doceditActiveTabService.getActiveTab();
            if (['relations','images','fields']
                    .indexOf(nextActiveTab) != -1) {
                result['tab'] = nextActiveTab;
            }

            if (document.resource.type == this.viewManager.getView().mainType) {
                this.documentsManager.deselect();
                this.mainTypeManager.selectMainTypeDocument(
                    result['document'] as IdaiFieldDocument, undefined,
                    () => {
                        result['tab'] = undefined;
                        this.documentsManager.deselect();
                    });
                return this.mainTypeManager.populateMainTypeDocuments(this.documentsManager.selected());
            } else {
                result['updateScrollTarget'] = true;
                return this.documentsManager.setSelected(result['document'] as IdaiFieldDocument);
            }
        }
        , closeReason => {

            this.documentEditChangeMonitor.reset();

            if (closeReason == 'deleted') {
                this.documentsManager.selectedDocument = undefined;
                if (document == this.mainTypeManager.selectedMainTypeDocument) {
                    return this.mainTypeManager.handleMainTypeDocumentOnDeleted(this.documentsManager.selected());
                }
            }

        })
        .then(() => this.documentsManager.populateDocumentList()) // do this in every case, since this is also the trigger for the map to get repainted with updated documents
        .then(() => {return result; });
    }
}