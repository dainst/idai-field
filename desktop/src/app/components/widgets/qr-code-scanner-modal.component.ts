import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import QrScanner from 'qr-scanner'; 


@Component({
    templateUrl: './qr-code-scanner-modal.html'
})
/**
 * @author Danilo Guzzo
 * @author Thomas Kleinke
 */
export class QrCodeScannerModalComponent implements OnInit {
    
    public cameraNotFound: boolean = false;

    private qrScanner: QrScanner;


    constructor(public activeModal: NgbActiveModal) {}


    async ngOnInit() {

        await this.startScanner();
    }


    public cancel() {
        
        if (!this.cameraNotFound) this.qrScanner.stop();
        this.activeModal.dismiss('cancel');
    }


    private async startScanner() {

        const videoElement: HTMLVideoElement = document.querySelector('video');

        this.qrScanner = new QrScanner(
            videoElement,
            result => {
                this.qrScanner.stop();
                this.activeModal.close(result.data);
            },
            {
                returnDetailedScanResult: true,
                highlightScanRegion: true,
                highlightCodeOutline: true
            }
        );

        try {
            await this.qrScanner.start();
        } catch (err) {
            if (err === 'Camera not found.') {
                this.cameraNotFound = true;
            } else {
                this.activeModal.dismiss(err);
            }
        }
    }
}
