import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PrintSettings } from './print-settings';


@Component({
    templateUrl: './create-print-settings-profile-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class CreatePrintSettingsProfileModalComponent {

    public printSettings: PrintSettings;

    public profileName: string = '';


    constructor(public activeModal: NgbActiveModal) {}


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public validate(): boolean {

        return this.profileName.length
            && !this.printSettings.profiles.find(profile => profile.name === this.profileName);
    }


    public confirm() {

        this.activeModal.close(this.profileName);
    }
}
