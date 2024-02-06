import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import QrScanner from 'qr-scanner'; 
import { Loading } from './loading';
import { Menus } from '../../services/menus';
import { MenuContext } from '../../services/menu-context';


type Camera = {
    id: string;
    label: string;
};


@Component({
    templateUrl: './qr-code-scanner-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Danilo Guzzo
 * @author Thomas Kleinke
 */
export class QrCodeScannerModalComponent implements OnInit {
    
    public cameras: Array<Camera>;
    public selectedCamera: Camera;
    public cameraNotFound: boolean = false;

    private qrScanner: QrScanner;


    constructor(public activeModal: NgbActiveModal,
                private loading: Loading,
                private menus: Menus) {}


    async ngOnInit() {

        await this.initialize();
    }


    public isLoading = () => this.loading.isLoading('qrCodeScanner');


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menus.getContext() === MenuContext.QR_CODE_SCANNER) {
            this.cancel();
        }
    }


    public cancel() {
        
        if (!this.cameraNotFound) this.stopScanner();
        if (this.loading.isLoading('qrCodeScanner')) this.loading.stop('qrCodeScanner', false);
        this.activeModal.dismiss('cancel');
    }


    public selectCamera(cameraId: string) {

        this.selectedCamera = this.cameras.find(camera => camera.id === cameraId);
        this.qrScanner.setCamera(this.selectedCamera.id);
    }


    private async initialize() {

        this.loading.start('qrCodeScanner', false);

        await this.initializeCameras();
        if (!this.cameraNotFound) await this.startScanner();
        
        this.loading.stop('qrCodeScanner', false);
    }


    private async initializeCameras() {

        this.cameras = await QrScanner.listCameras(true);
        if (this.cameras.length > 0) {
            this.selectedCamera = this.cameras[0];
        } else {
            this.cameraNotFound = true;
        }
    }


    private async startScanner() {

        const videoElement: HTMLVideoElement = document.querySelector('video');

        this.qrScanner = new QrScanner(
            videoElement,
            result => {
                this.stopScanner();
                this.activeModal.close(result.data);
            },
            {
                preferredCamera: this.selectedCamera.id,
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


    private stopScanner() {

        this.qrScanner.stop();
        this.qrScanner.destroy();
    }
}
