import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Routing } from '../../services/routing';
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
    public hasCamera: boolean;

    // create web audio api context
    private context = new AudioContext();

    @Output() onRelationClicked: EventEmitter<FieldDocument> = new EventEmitter<FieldDocument>();

    constructor(
        public activeModal: NgbActiveModal
    ) { 
        this.hasCamera = true;
     }

    ngOnInit(): void {
        // returns the first Element within the HTML document that matches the specified selector
        this.videoElem = document.querySelector("video");

        // create a new QrScanner object 
        this.qrScanner = new QrScanner(
            this.videoElem,
            result => {
                // it plays the beep sound with 100% volume, frequency 886Hz (the A5 note), with duration 100 milliseconds
                this.playBeep(100,886,100);
                // it stops the scanner and closes the window
                this.qrScanner.stop();
                this.activeModal.close(result.data);
            },
            { returnDetailedScanResult: true, highlightScanRegion: true }
        );

        // if the camera is founded starts the scanner
        this.qrScanner.start().then(
            () => {
                this.hasCamera = true;
            },
            // otherwise gives an error
            (error) => {
                this.hasCamera = false;
            }
        );
    }

    public close = () => this.activeModal.close();

    /** duration of the tone in milliseconds. Default is 500
    *   frequency of the tone in hertz. default is 440Hz
    *   volume of the tone. Default is 1, off is 0.
    */
    private playBeep(vol: number, freq: number, duration: number) {

        // create Oscillator node
        const v = this.context.createOscillator();
        // create a Gain node (interface that represent a change in volume)
        const u = this.context.createGain();
        
        // links the oscillator to the gain node to control the volume
        v.connect(u);
        v.frequency.value = freq;
        //type of tone. Possible values are sine, square, sawtooth, triangle, and custom. Default is sine.
        v.type = 'square';

        // connect the gain to the destination so we hear sound
        u.connect(this.context.destination);
        u.gain.value = vol*.01;
        
        // start the oscillator that will produce audio
        v.start(this.context.currentTime);
        v.stop(this.context.currentTime + duration*.001);
    }
}