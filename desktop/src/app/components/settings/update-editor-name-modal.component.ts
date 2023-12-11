import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SettingsService } from '../../services/settings/settings-service';
import { SettingsProvider } from '../../services/settings/settings-provider';
import { Settings } from '../../services/settings/settings';


@Component({
    templateUrl: './update-editor-name-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Danilo Guzzo
 */
export class UpdateEditorNameModalComponent {

    public editorName: string;


    constructor(public activeModal: NgbActiveModal,
                private settingsService: SettingsService,
                private settingsProvider: SettingsProvider) {

        this.editorName = this.settingsProvider.getSettings().username;
    }


    public cancel = () => this.activeModal.dismiss('cancel');
    

    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Enter') this.confirm();
    }


    public confirm() {

        const settings: Settings = this.settingsProvider.getSettings();
        settings.username = this.editorName;  

        this.settingsService.updateSettings(settings);
        this.activeModal.close();
    }
}
