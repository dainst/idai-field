import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

const QRCode = require('qrcode');


@Component({
    templateUrl: './qr-code-modal.html'
})
/**
 * @author Danilo Guzzo
 */
export class QrCodeModalComponent {
   
    @Input() public project: string;
    @Input() public documentId: string;
    @Input() public identifier: string;


    constructor(public activeModal: NgbActiveModal) {}


    public cancel = () => this.activeModal.close();

    
    public render() {
    
        const container = document.getElementById('qr-code-canvas');

        QRCode.toCanvas(
            container, 
            `${this.documentId}@${this.project}`, 
            { width: 300 }
        );
    }
}
