import { Component, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import QrScanner from 'qr-scanner'; 

@Component({
    selector: 'qrcode-scanner-modal',
    templateUrl: './resources-search-modal-qr.html'
})
/**
 * @author Danilo Guzzo
 */
export class QrCodeScannerModalComponent implements OnInit {
    
    private qrScanner: any;
    private videoElem: any;
    private streaming: boolean;
   
    constructor(
        public activeModal: NgbActiveModal,
        private modalService: NgbModal
    ) {
     }

    ngOnInit(): void {
        
        this.streaming = false;
        this.videoElem = document.querySelector("video");

        // this.videoElem.addEventListener(
        //     "canplay",
        //     (ev) => {
        //       if (!this.streaming) {
        //         this.streaming = true;
        //       }
        //     },
        //     false,
        //   );
        // this.qrScanner = new QrScanner(
        //     videoElem,
        //     result => console.log('decoded qr code:', result),
        //     { returnDetailedScanResult: true }
        // );

    }

    public async startScanning() {
        
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });

        this.videoElem.srcObject = stream;
        this.videoElem.play()

    }

    openModal(id: string) {
        this.modalService.open(id);
    }

    public close = () => this.activeModal.close();
}