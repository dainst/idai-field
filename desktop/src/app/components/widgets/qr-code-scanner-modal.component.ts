import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import QrScanner from 'qr-scanner'; 
import { Loading } from './loading';
import { Menus } from '../../services/menus';
import { MenuContext } from '../../services/menu-context';
import { AppState } from '../../services/app-state';


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
                private menus: Menus,
                private appState: AppState,
                private changeDetectorRef: ChangeDetectorRef) {}


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
        this.setCamera(this.selectedCamera);
    }


    private async initialize() {

        this.loading.start('qrCodeScanner', false);

        await this.initializeCameras();
        if (!this.cameraNotFound) await this.startScanner();
        this.changeDetectorRef.detectChanges();

        this.loading.stop('qrCodeScanner', false);
    }


    private async initializeCameras() {

        try {
            this.cameras = await QrScanner.listCameras(true);
            if (this.cameras.length > 0) {
                this.selectedCamera = this.getCameraFromAppState() ?? this.cameras[0];
            } else {
                this.cameraNotFound = true;
            }
        } catch (err) {
            this.activeModal.dismiss(err);
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

        this.appState.setCodeScannerCameraId(this.selectedCamera.id);

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


    private setCamera(camera: Camera) {

        this.qrScanner.setCamera(this.selectedCamera.id);
        this.appState.setCodeScannerCameraId(camera.id);
    }


    private getCameraFromAppState(): Camera|undefined {

        const cameraId: string = this.appState.getCodeScannerCameraId();
        if (!cameraId) undefined;

        return this.cameras.find(camera => camera.id === cameraId);
    }
}
