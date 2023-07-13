import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
var  QRCode = require('qrcode')

@Component({
    selector: 'qrcode-modal',
    templateUrl: './qrcode-modal.html'
})
/**
 * @author Danilo Guzzo
 */
export class QrCodeModalComponent {
   
    @Input()
    public project: string;
    @Input()
    public documentId: string;
    @Input()
    public identifier: string;

    constructor(
        public activeModal: NgbActiveModal
    ) { }

    public close = () => this.activeModal.close();

    public render() {
        var container = document.getElementById('qrcode-canvas')
        QRCode.toCanvas(
            container, 
            `${this.documentId}@${this.project}`, 
            {width: 300}
        );
    }
}