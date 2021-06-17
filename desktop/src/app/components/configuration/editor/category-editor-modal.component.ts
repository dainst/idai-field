import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { AppConfigurator } from 'idai-field-core';
import { equal } from 'tsfun';
import { SettingsProvider } from '../../../core/settings/settings-provider';
import { MenuService } from '../../menu-service';
import { Messages } from '../../messages/messages';
import { ConfigurationEditorModalComponent } from './configuration-editor-modal.component';


@Component({
    templateUrl: './category-editor-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
        '(window:keyup)': 'onKeyUp($event)',
    }
})
/**
 * @author Thomas Kleinke
 */
export class CategoryEditorModalComponent extends ConfigurationEditorModalComponent {

    protected changeMessage = this.i18n({
        id: 'docedit.saveModal.categoryChanged', value: 'Die Kategorie wurde geändert.'
    });


    constructor(activeModal: NgbActiveModal,
                appConfigurator: AppConfigurator,
                settingsProvider: SettingsProvider,
                modalService: NgbModal,
                menuService: MenuService,
                messages: Messages,
                private i18n: I18n) {
        
        super(activeModal, appConfigurator, settingsProvider, modalService, menuService, messages);
    }


    public isChanged(): boolean {

        return !equal(this.label)(this.clonedLabel)
            || !equal(this.description)(this.clonedDescription);
    }
}
