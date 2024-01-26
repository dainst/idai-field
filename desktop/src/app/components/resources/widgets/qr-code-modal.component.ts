import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FieldDocument } from 'idai-field-core';

const QRCode = require('qrcode');


@Component({
    templateUrl: './qr-code-modal.html'
})
/**
 * @author Danilo Guzzo
 */
export class QrCodeModalComponent {
   
    @Input() public document: FieldDocument;


    constructor(public activeModal: NgbActiveModal) {}


    public cancel = () => this.activeModal.close();

    
    public render() {
    
        const container = document.getElementById('qr-code-canvas');

        QRCode.toCanvas(
            container, 
            this.document.resource.id,
            { width: 300 }
        );
    }
}
