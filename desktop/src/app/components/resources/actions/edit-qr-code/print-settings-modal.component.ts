import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';


const DEFAULT_PAGE_WIDTH = 76;          // mm
const DEFAULT_PAGE_HEIGHT = 25;         // mm
const DEFAULT_CONTAINER_HEIHT = 280;    // px


export interface PrintSettings {

    pageWidth: number;
    pageHeight: number;
    scale: number;
    marginLeft: number;
    marginTop: number;
    autoMarginTop: number;
}


@Component({
    templateUrl: './print-settings-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Thomas Kleinke
 */
export class PrintSettingsModalComponent {

    public settings: PrintSettings;

    constructor(public activeModal: NgbActiveModal) {}


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public initialize() {

        this.settings = {
            pageWidth: DEFAULT_PAGE_WIDTH,
            pageHeight: DEFAULT_PAGE_HEIGHT,
            scale: 100,
            marginLeft: 0,
            marginTop: 0,
            autoMarginTop: 0
        };
    }


    public confirm() {

        if (this.settings.pageHeight > this.settings.pageWidth) this.swapPageWidthAndHeight();
        this.settings.scale = this.getAutoScale() * (this.settings.scale / 200.0);
        this.settings.autoMarginTop = this.getAutoMarginTop();
        
        this.activeModal.close(this.settings);
    }

    
    private swapPageWidthAndHeight() {

        const pageWidth: number = this.settings.pageWidth;
        this.settings.pageWidth = this.settings.pageHeight;
        this.settings.pageHeight = pageWidth;
    }


    private getAutoScale(): number {

        return Math.min(
            this.settings.pageWidth / DEFAULT_PAGE_WIDTH,
            this.settings.pageHeight / DEFAULT_PAGE_HEIGHT
        );
    }


    private getAutoMarginTop(): number {

        const heightScale: number = this.settings.pageHeight / DEFAULT_PAGE_HEIGHT / 2;

        if (heightScale > this.settings.scale) {
            return DEFAULT_CONTAINER_HEIHT * (heightScale - this.settings.scale) / 2;
        } else {
            return 0;
        }
    }
}
