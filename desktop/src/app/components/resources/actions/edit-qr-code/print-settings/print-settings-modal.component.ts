import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { PrintSettings } from './print-settings';
import { AngularUtility } from '../../../../../angular/angular-utility';
import { PrintSettingsProfile } from './print-settings-profile';
import { Menus } from '../../../../../services/menus';
import { MenuContext } from '../../../../../services/menu-context';
import { CreatePrintSettingsProfileModalComponent } from './create-print-settings-profile-modal.component';


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
    public selectedProfile: PrintSettingsProfile;


    constructor(public activeModal: NgbActiveModal,
                private modalService: NgbModal,
                private menus: Menus) {}


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menus.getContext() === MenuContext.PRINT_SETTINGS_MODAL) {
            this.activeModal.dismiss('cancel');
        }
    }


    public async initialize() {

        this.settings = await PrintSettings.load();
        this.updateSelectedProfile();

        AngularUtility.blurActiveElement();
    }

    
    public updateSelectedProfile() {

        this.selectedProfile = PrintSettings.getProfile(this.settings, this.settings.selectedProfile);
    }


    public async confirm() {

        await PrintSettings.store(this.settings);
        this.activeModal.close(this.settings);
    }


    public validate(): boolean {

        return PrintSettings.validate(this.settings);
    }


    public getProfileLabel(profile: PrintSettingsProfile): string {

        return profile.name === ''
            ? $localize `:@@resources.printSettingsModal.default:Standard`
            : profile.name;
    }


    public async addNewProfile() {

        const profileName: string = await this.openCreatePrintSettingsProfileModal();
        if (!profileName) return;

        const newProfile: PrintSettingsProfile = PrintSettingsProfile.createDefaultProfile();
        newProfile.name = profileName;

        this.settings.profiles.push(newProfile);
        this.settings.selectedProfile = newProfile.name;

        this.updateSelectedProfile();
    }


    public deleteSelectedProfile() {

        PrintSettings.deleteProfile(this.settings, this.settings.selectedProfile);
        this.updateSelectedProfile();
    }


    private async openCreatePrintSettingsProfileModal(): Promise<string> {

        this.menus.setContext(MenuContext.MODAL);

        try {
            const modalRef: NgbModalRef = this.modalService.open(
                CreatePrintSettingsProfileModalComponent,
                { animation: false, backdrop: 'static', keyboard: false }
            );
            modalRef.componentInstance.printSettings = this.settings;
            return await modalRef.result;
        } catch (err) {
            // Create print settings profile modal has been cancelled
        } finally {
            this.menus.setContext(MenuContext.PRINT_SETTINGS_MODAL);
            AngularUtility.blurActiveElement();
        }
    }
}
