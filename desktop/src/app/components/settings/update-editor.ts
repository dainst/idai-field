import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SettingsService } from '../../services/settings/settings-service';
import { SettingsProvider } from '../../services/settings/settings-provider';
import { Settings } from '../../services/settings/settings';


@Component({
    templateUrl: './update-editor.html',
    host: {
        '(window:keydown)': 'clickEnter($event)'
    }
})
/**
 * @author Danilo Guzzo
 */
export class UpdateEditorComponent {
    public currentEditor: string;


    constructor(
        public activeModal: NgbActiveModal,
        private settingsService: SettingsService,
        private settingsProvider: SettingsProvider
    ) {
        this.currentEditor = this.settingsProvider.getSettings().username;
    }


    public confirm = () => {
        let oldSettings: Settings = this.settingsProvider.getSettings();
        oldSettings.username = this.currentEditor;  

        this.settingsService.updateSettings(oldSettings);
        this.activeModal.close();
    }


    public cancel = () => this.activeModal.dismiss('cancel');
    

    public clickEnter(event: KeyboardEvent){
        if(event.key === 'Enter'){
            this.confirm();
        }
    }
}