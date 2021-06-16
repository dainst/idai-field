import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConfigurator } from 'idai-field-core';
import { SettingsProvider } from '../../../core/settings/settings-provider';
import { ConfigurationEditorModalComponent } from './configuration-editor-modal.component';


@Component({
    templateUrl: './category-editor-modal.html'
})
/**
 * @author Thomas Kleinke
 */
export class CategoryEditorModalComponent extends ConfigurationEditorModalComponent {

    constructor(activeModal: NgbActiveModal,
                appConfigurator: AppConfigurator,
                settingsProvider: SettingsProvider) {
        
        super(activeModal, appConfigurator, settingsProvider);
    }
}
