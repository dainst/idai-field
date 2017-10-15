import {Injectable} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Document} from 'idai-components-2/core';
import {DocumentEditChangeMonitor} from 'idai-components-2/documents';
import {DoceditComponent} from '../../docedit/docedit.component';
import {DoceditActiveTabService} from '../../docedit/docedit-active-tab-service';
import {DocumentsManager} from './documents-manager';
import {MainTypeManager} from './main-type-manager';

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
            private mainTypeManager: MainTypeManager
    ) {
    }


    public editDocument(document: Document, resultCallback: Function,
                        activeTabName?: string) {

        if (activeTabName) this.doceditActiveTabService.setActiveTab(activeTabName);

        const doceditRef = this.modalService.open(DoceditComponent, { size: 'lg', backdrop: 'static' });
        doceditRef.componentInstance.setDocument(document);

        doceditRef.result.then(result => {

                const nextActiveTab = this.doceditActiveTabService.getActiveTab();
                if (['relations','images','fields']
                        .indexOf(nextActiveTab) != -1) {
                    result['tab'] = nextActiveTab;
                }
                resultCallback(result);

                return this.mainTypeManager.populateMainTypeDocuments( // TODO this can be done with documentsManager.setSelected; if we do the todo at the bottom, we might get rid of this entirely
                        this.documentsManager.selectedDocument
                    ).then(() =>
                        this.documentsManager.invalidateQuerySettingsIfNecessary() // ---------
                    );
            }
            , closeReason => {

                this.documentEditChangeMonitor.reset();

                if (closeReason == 'deleted') {
                    this.documentsManager.selectedDocument = undefined;
                    if (document == this.mainTypeManager.selectedMainTypeDocument) {
                        return this.mainTypeManager.
                            handleMainTypeDocumentOnDeleted(
                                this.documentsManager.selectedDocument);
                    }
                }

            })
            .then(() => this.documentsManager.populateDocumentList()) // do this in every case, since this is also the trigger for the map to get repainted with updated documents
            .then(() => this.documentsManager.insertRecordsIntoSelected()); // TODO if we stay with the insertRecords functionality of documentsManager.setSelected, consider using setSelected in order to replace this and the previous line; give setSelected a forcePopulate param then, so that the requirement from previous line stays fulfilled
    }
}