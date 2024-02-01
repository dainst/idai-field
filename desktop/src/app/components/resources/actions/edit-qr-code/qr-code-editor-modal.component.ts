import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Datastore, FieldDocument, IdGenerator } from 'idai-field-core';
import { Messages } from '../../../messages/messages';
import { QrCodeScannerModalComponent } from '../../../widgets/qr-code-scanner-modal.component';
import { DeleteQrCodeModalComponent } from './delete-qr-code-modal.component';
import { AngularUtility } from '../../../../angular/angular-utility';
import { M } from '../../../messages/m';
import { Menus } from '../../../../services/menus';
import { MenuContext } from '../../../../services/menu-context';

const QRCode = require('qrcode');


@Component({
    templateUrl: './qr-code-editor-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Danilo Guzzo
 * @author Thomas Kleinke
 */
export class QrCodeEditorModalComponent implements AfterViewInit {
   
    @Input() public document: FieldDocument;

    @ViewChild('qrCodeCanvas', { static: false }) canvasElement: ElementRef;


    constructor(private activeModal: NgbActiveModal,
                private idGenerator: IdGenerator,
                private datastore: Datastore,
                private messages: Messages,
                private modalService: NgbModal,
                private menus: Menus) {}


    public cancel = () => this.activeModal.close();

    public hasQrCode = () => this.document.resource.scanCode !== undefined;


    ngAfterViewInit() {
        
        if (this.hasQrCode()) this.renderCode();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menus.getContext() === MenuContext.QR_CODE_EDITOR) {
            this.cancel();
        }
    }


    public async createNewCode() {

        await this.saveCode(this.idGenerator.generateId());
    }


    public async setExistingCode() {

        const code: string = await this.scanExistingCode();
        if (!code) return;

        if (this.isUnassignedCode(code)) {
            await this.saveCode(code);
        } else {
            this.messages.add([M.RESOURCES_ERROR_QR_CODE_ALREADY_ASSIGNED]);
        }
    }


    public async deleteCode() {

        this.menus.setContext(MenuContext.MODAL);

        try {
            const modalRef: NgbModalRef = this.modalService.open(
                DeleteQrCodeModalComponent,
                { animation: false, backdrop: 'static', keyboard: false }
            );
            modalRef.componentInstance.document = this.document;
            AngularUtility.blurActiveElement();

            if (await modalRef.result) await this.saveCode(undefined);
        } catch (err) {
            // Delete QR code modal has been cancelled
        } finally {
            this.menus.setContext(MenuContext.QR_CODE_EDITOR);
        }
    }

    
    private renderCode() {

        QRCode.toCanvas(
            this.canvasElement.nativeElement, 
            this.document.resource.scanCode,
            { width: 300 }
        );
    }


    private async saveCode(newCode?: string) {

        if (newCode) {
            this.document.resource.scanCode = newCode;
        } else {
            delete this.document.resource.scanCode;
        }

        try {
            await this.datastore.update(this.document);
            if (newCode) this.renderCode();
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }


    private async scanExistingCode(): Promise<string> {

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
            this.menus.setContext(MenuContext.QR_CODE_EDITOR);
        }
    }


    private isUnassignedCode(code: string): boolean {

        return this.datastore.findIds({ constraints: { 'scanCode:match': code } }).totalCount === 0;
    }
}
