import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { equal, isEmpty } from 'tsfun';
import { AppConfigurator, CustomCategoryDefinition } from 'idai-field-core';
import { InputType } from '../configuration-field.component';
import { ConfigurationUtil } from '../../../core/configuration/configuration-util';
import { OVERRIDE_VISIBLE_FIELDS } from '../configuration-category.component';
import { SettingsProvider } from '../../../core/settings/settings-provider';
import { ConfigurationEditorModalComponent } from './configuration-editor-modal.component';
import { MenuService } from '../../menu-service';


@Component({
    templateUrl: './field-editor-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
        '(window:keyup)': 'onKeyUp($event)',
    }
})
/**
 * @author Thomas Kleinke
 */
export class FieldEditorModalComponent extends ConfigurationEditorModalComponent {

    public availableInputTypes: Array<InputType>;

    public hideable: boolean;
    public hidden: boolean;

    protected changeMessage = this.i18n({
        id: 'docedit.saveModal.fieldChanged', value: 'Das Feld wurde geändert.'
    });


    constructor(activeModal: NgbActiveModal,
                appConfigurator: AppConfigurator,
                settingsProvider: SettingsProvider,
                modalService: NgbModal,
                menuService: MenuService,
                private i18n: I18n) {
        
        super(activeModal, appConfigurator, settingsProvider, modalService, menuService);
    }


    public initialize() {

        super.initialize();

        if (!this.getClonedCategoryDefinition().fields[this.field.name]) {
            this.getClonedCategoryDefinition().fields[this.field.name] = {};
        }

        this.hideable = this.isHideable();
        this.hidden = this.isHidden();
    }


    public async save() {

        if (isEmpty(this.getClonedCategoryDefinition().fields[this.field.name])
                || this.getClonedCategoryDefinition().fields[this.field.name].inputType === this.field.inputType) {
            delete this.getClonedCategoryDefinition().fields[this.field.name];
        }

        super.save();
    }


    public getInputType() {

        return this.getClonedCategoryDefinition().fields[this.field.name].inputType
            ?? this.field.inputType;
    }


    public setInputType(newInputType: string) {

        this.getClonedCategoryDefinition().fields[this.field.name].inputType = newInputType;
    }


    public toggleHidden() {

        const customCategoryDefinition: CustomCategoryDefinition = this.getClonedCategoryDefinition();

        if (this.hidden) {
            customCategoryDefinition.hidden
                = customCategoryDefinition.hidden.filter(name => name !== this.field.name);
        } else {
            if (!customCategoryDefinition.hidden) customCategoryDefinition.hidden = [];
            customCategoryDefinition.hidden.push(this.field.name);
        }

        this.hidden = this.isHidden();
    }


    public isChanged(): boolean {

        return (!equal(this.field.inputType)(this.getClonedCategoryDefinition().fields[this.field.name]?.inputType))
            || !equal(this.label)(this.clonedLabel)
            || !equal(this.description)(this.clonedDescription);
    }


    private isHideable(): boolean {

        return !OVERRIDE_VISIBLE_FIELDS.includes(this.field.name)
            && this.field.source !== 'custom';
    }


    private isHidden(): boolean {

        return ConfigurationUtil.isHidden(this.getClonedCategoryDefinition())(this.field);
    }
}
