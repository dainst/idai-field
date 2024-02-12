import { Injectable } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Datastore } from 'idai-field-core';
import { M } from '../../messages/m';
import { Routing } from '../../../services/routing';
import { Messages } from '../../messages/messages';
import { Menus } from '../../../services/menus';
import { MenuContext } from '../../../services/menu-context';
import { QrCodeScannerModalComponent } from '../../widgets/qr-code-scanner-modal.component';
import { AngularUtility } from '../../../angular/angular-utility';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class QrCodeService {

    constructor(private datastore: Datastore,
                private routingService: Routing,
                private messages: Messages,
                private menus: Menus,
                private modalService: NgbModal) {}


    public async scanCode(): Promise<string|undefined> {

        const menuContext: MenuContext = this.menus.getContext();
        this.menus.setContext(MenuContext.QR_CODE_SCANNER);

        try {
            const modalRef: NgbModalRef = this.modalService.open(
                QrCodeScannerModalComponent,
                { animation: false, backdrop: 'static', keyboard: false }
            );
            return await modalRef.result;
        } catch (closeReason) {
            if (closeReason !== 'cancel') {
                this.messages.add([M.RESOURCES_ERROR_QR_CODE_SCANNING_FAILURE]);
                console.error(closeReason);
            }
            return undefined;
        } finally {
            this.menus.setContext(menuContext);
            AngularUtility.blurActiveElement(); 
        }
    }


    public async openDocumentFromScannedCode(scannedCode: string) {

        const result: Datastore.FindResult = await this.datastore.find(
            { constraints: { 'scanCode:match': scannedCode } }
        );

        if (result.documents.length > 0) {
            this.routingService.jumpToResource(result.documents[0]);
        } else {
            this.messages.add([M.RESOURCES_ERROR_QR_CODE_RESOURCE_NOT_FOUND]);
        }
    }
}
