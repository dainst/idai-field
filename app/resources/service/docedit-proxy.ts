import {Injectable} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Document} from 'idai-components-2/core';
import {DocumentEditChangeMonitor} from 'idai-components-2/documents';
import {DoceditComponent} from '../../docedit/docedit.component';
import {DoceditActiveTabService} from '../../docedit/docedit-active-tab-service';

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
            private documentEditChangeMonitor: DocumentEditChangeMonitor) {
    }

    public editDocument(document: Document, resultCallback: Function, closeReasonCallback: Function,
                        activeTabName?: string) {

        if (activeTabName) this.doceditActiveTabService.setActiveTab(activeTabName);

        const doceditRef = this.modalService.open(DoceditComponent, { size: 'lg', backdrop: 'static' });
        doceditRef.componentInstance.setDocument(document);

        return doceditRef.result.then(result => {

                const nextActiveTab = this.doceditActiveTabService.getActiveTab();
                if (['relations','images','fields']
                        .indexOf(nextActiveTab) != -1) {
                    result['tab'] = nextActiveTab;
                }
                return resultCallback(result);
            }
            , closeReason => {
                this.documentEditChangeMonitor.reset();
                return closeReasonCallback(closeReason);
            }
        );
    }
}