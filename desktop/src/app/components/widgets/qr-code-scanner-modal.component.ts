import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import QrScanner from 'qr-scanner'; 


@Component({
    templateUrl: './qr-code-scanner-modal.html'
})

/**
 * @author Danilo Guzzo
 */
export class QrCodeScannerModalComponent implements OnInit {
    
    public hasCamera: boolean;

    private qrScanner: any;


    constructor(public activeModal: NgbActiveModal) { 

        this.hasCamera = true;
    }

    public cancel = () => this.activeModal.dismiss('cancel');


    async ngOnInit() {

        const videoElement: HTMLVideoElement = document.querySelector('video');

        this.qrScanner = new QrScanner(
            videoElement,
            result => {
                this.qrScanner.stop();
                this.activeModal.close(result.data);
            },
            {
                returnDetailedScanResult: true,
                highlightScanRegion: true
            }
        );

        try {
            await this.qrScanner.start();
            this.hasCamera = true;
        } catch (err) {
            console.error(err);
            this.hasCamera = false;
        }
    }
}
