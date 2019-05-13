import {Injectable} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Document, NewDocument, FieldDocument} from 'idai-components-2';
import {DoceditComponent} from '../../docedit/docedit.component';
import {ViewFacade} from '../view/view-facade';
import {MenuService} from '../../../menu-service';


@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class DoceditLauncher {

    constructor(
            private modalService: NgbModal,
            private viewFacade: ViewFacade
    ) {}


    public async editDocument(document: Document|NewDocument,
                              activeGroup?: string): Promise<FieldDocument|undefined> {

        MenuService.setContext('docedit');

        const doceditRef = this.modalService.open(DoceditComponent,
            { size: 'lg', backdrop: 'static', keyboard: false });
        doceditRef.componentInstance.setDocument(document);
        if (activeGroup) doceditRef.componentInstance.activeGroup = activeGroup;

        let result: FieldDocument|undefined;

        try {
            result = (await doceditRef.result)['document'];
            await this.handleSaveResult(result as FieldDocument);
        } catch (closeReason) {
            if (closeReason === 'cancel') this.viewFacade.removeNewDocument();
        }

        MenuService.setContext('default');

        return result;
    }


    private async handleSaveResult(document: FieldDocument) {

        await this.viewFacade.populateDocumentList();
        await this.viewFacade.setSelectedDocument(document.resource.id);
    }
}
