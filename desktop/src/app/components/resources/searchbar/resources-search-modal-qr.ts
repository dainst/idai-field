import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Routing } from '../../../services/routing';
import { Datastore, FieldDocument } from 'idai-field-core';
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
   
    @Output() onRelationClicked: EventEmitter<FieldDocument> = new EventEmitter<FieldDocument>();

    constructor(
        public activeModal: NgbActiveModal,
        private modalService: NgbModal,
        private datastore: Datastore,
        private routingService: Routing
    ) {
     }

    ngOnInit(): void {
        
        this.videoElem = document.querySelector("video");

        this.qrScanner = new QrScanner(
            this.videoElem,
            result => {
                this.qrScanner.stop();
                this.openDocument(result.data);
            },
            { returnDetailedScanResult: true, highlightScanRegion: true }
        );

        this.qrScanner.start();
    }

    private async openDocument(scannedCode: string) {
        const [uuid, projectName] = scannedCode.split('@')

        // console.log(`Opening ${uuid} in project ${projectName}!`);

        const document = (await this.datastore.get(uuid) as FieldDocument);

        this.routingService.jumpToResource(document);
        this.activeModal.close();
    }

    public close = () => this.activeModal.close();
}