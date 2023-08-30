import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
var QRCode = require('qrcode');

@Component({
    selector: 'qrcode-modal',
    templateUrl: './qrcode-modal.html'
})
/**
 * @author Danilo Guzzo
 */
export class QrCodeModalComponent {
   
    // lets a parent component update data in the child component.
    @Input()
    public project: string;
    @Input()
    public documentId: string;
    @Input()
    public identifier: string;

    constructor(
        public activeModal: NgbActiveModal
    ) { }

    //Method to close the modal window
    public close = () => this.activeModal.close();

    //It takes documentId and the project's name and put in the QR-Code
    public render() {
        var container = document.getElementById('qrcode-canvas')
        QRCode.toCanvas(
            container, 
            `${this.documentId}@${this.project}`, 
            {width: 300}
        );
    }
}