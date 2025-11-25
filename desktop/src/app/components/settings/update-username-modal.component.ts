import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SettingsService } from '../../services/settings/settings-service';
import { SettingsProvider } from '../../services/settings/settings-provider';
import { Settings } from '../../services/settings/settings';
import { MenuContext } from '../../services/menu-context';
import { Menus } from '../../services/menus';


@Component({
    templateUrl: './update-username-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    },
    standalone: false
})
/**
 * @author Danilo Guzzo
 * @author Thomas Kleinke
 */
export class UpdateUsernameModalComponent {

    public welcomeMode: boolean;
    
    public username: string;


    constructor(public activeModal: NgbActiveModal,
                private settingsService: SettingsService,
                private settingsProvider: SettingsProvider,
                private menuService: Menus) {

        this.username = this.getUsernameFromSettings();
    }


    public cancel = () => this.activeModal.dismiss('cancel');

    public isUsernameSet = () => Settings.isUsername(this.username);
    

    public onKeyDown(event: KeyboardEvent) {

        if (![MenuContext.MODAL, MenuContext.CONFIGURATION_MODAL].includes(this.menuService.getContext())) return;

        if (event.key === 'Enter') {
            this.confirm();
        } else if (event.key === 'Escape' && !this.welcomeMode) {
            this.cancel();
        }
    }


    public confirm() {

        if (!this.isUsernameSet()) return;

        const settings: Settings = this.settingsProvider.getSettings();
        settings.username = this.username;  

        this.settingsService.updateSettings(settings);
        this.activeModal.close();
    }


    private getUsernameFromSettings(): string {

        const username: string = this.settingsProvider.getSettings().username;
        return username === 'anonymous' ? '' : username;
    }
}
