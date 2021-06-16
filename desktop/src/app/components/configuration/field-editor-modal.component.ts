import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { isEmpty } from 'tsfun';
import { AppConfigurator, CustomCategoryDefinition } from 'idai-field-core';
import { InputType } from './configuration-field.component';
import { ConfigurationUtil } from '../../core/configuration/configuration-util';
import { OVERRIDE_VISIBLE_FIELDS } from './configuration-category.component';
import { SettingsProvider } from '../../core/settings/settings-provider';
import { ConfigurationEditorModalComponent } from './configuration-editor-modal.component';


@Component({
    templateUrl: './field-editor-modal.html'
})
/**
 * @author Thomas Kleinke
 */
export class FieldEditorModalComponent extends ConfigurationEditorModalComponent {

    public availableInputTypes: Array<InputType>;

    public hideable: boolean;
    public hidden: boolean;


    constructor(activeModal: NgbActiveModal,
                appConfigurator: AppConfigurator,
                settingsProvider: SettingsProvider) {
        
        super(activeModal, appConfigurator, settingsProvider);
    }


    public initialize() {

        if (!this.getCustomCategoryDefinition().fields[this.field.name]) {
            this.getCustomCategoryDefinition().fields[this.field.name] = {};
        }

        this.hideable = this.isHideable();
        this.hidden = this.isHidden();

        super.initialize();
    }


    public async save() {

        if (isEmpty(this.getCustomCategoryDefinition().fields[this.field.name])) {
            delete this.getCustomCategoryDefinition().fields[this.field.name];
        }

        super.save();
    }


    public getInputType() {

        return this.getCustomCategoryDefinition().fields[this.field.name].inputType
            ?? this.field.inputType;
    }


    public setInputType(newInputType: string) {

        this.getCustomCategoryDefinition().fields[this.field.name].inputType = newInputType;
    }


    public toggleHidden() {

        const customCategoryDefinition: CustomCategoryDefinition = this.getCustomCategoryDefinition();

        if (this.hidden) {
            customCategoryDefinition.hidden
                = customCategoryDefinition.hidden.filter(name => name !== this.field.name);
        } else {
            if (!customCategoryDefinition.hidden) customCategoryDefinition.hidden = [];
            customCategoryDefinition.hidden.push(this.field.name);
        }

        this.hidden = this.isHidden();
    }


    private isHideable(): boolean {

        return !OVERRIDE_VISIBLE_FIELDS.includes(this.field.name)
            && this.field.source !== 'custom';
    }


    private isHidden(): boolean {

        return ConfigurationUtil.isHidden(this.getCustomCategoryDefinition())(this.field);
    }
}
