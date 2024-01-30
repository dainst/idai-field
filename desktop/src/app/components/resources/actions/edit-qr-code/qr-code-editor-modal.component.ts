import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Datastore, FieldDocument, IdGenerator } from 'idai-field-core';
import { Messages } from '../../../messages/messages';
import { QrCodeScannerModalComponent } from '../../../widgets/qr-code-scanner-modal.component';

const QRCode = require('qrcode');


@Component({
    templateUrl: './qr-code-editor-modal.html'
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
                private modalService: NgbModal) {}


    public cancel = () => this.activeModal.close();

    public hasQrCode = () => this.document.resource.scanCode !== undefined;


    ngAfterViewInit() {
        
        if (this.hasQrCode()) this.renderCode();
    }


    public async createNewCode() {

        await this.saveCode(this.idGenerator.generateId());
    }


    public async setExistingCode() {

        const code: string = await this.scanExistingCode();
        if (code) await this.saveCode(code);
    }

    
    private renderCode() {

        QRCode.toCanvas(
            this.canvasElement.nativeElement, 
            this.document.resource.scanCode,
            { width: 300 }
        );
    }

    private async saveCode(newCode: string) {

        this.document.resource.scanCode = newCode;

        try {
            await this.datastore.update(this.document);
            this.renderCode();
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }


    private async scanExistingCode(): Promise<string> {

        try {
            const modalRef: NgbModalRef = this.modalService.open(
                QrCodeScannerModalComponent,
                { animation: false, backdrop: 'static', keyboard: false }
            );

            return await modalRef.result;
        } catch (err) {
            console.error(err);
            return undefined;
        }
    }
}
