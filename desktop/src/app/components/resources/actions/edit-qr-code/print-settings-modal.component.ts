import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PrintSettings } from './print-settings';
import { AngularUtility } from '../../../../angular/angular-utility';


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


    public async initialize() {

        this.settings = await PrintSettings.load();
        AngularUtility.blurActiveElement();
    }


    public async confirm() {

        await PrintSettings.store(this.settings);
        this.activeModal.close(this.settings);
    }
}
