import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { isEmpty } from 'tsfun';
import { AppConfigurator, Category, ConfigurationDocument, CustomCategoryDefinition, FieldDefinition,
    getConfigurationName, I18nString, ProjectConfiguration, Document } from 'idai-field-core';
import { LanguageConfigurationUtil } from '../../core/configuration/language-configuration-util';
import { InputType } from './configuration-field.component';
import { ConfigurationUtil } from '../../core/configuration/configuration-util';
import { OVERRIDE_VISIBLE_FIELDS } from './configuration-category.component';
import { SettingsProvider } from '../../core/settings/settings-provider';


@Component({
    templateUrl: './field-editor-modal.html'
})
/**
 * @author Thomas Kleinke
 */
export class FieldEditorModalComponent {

    public clonedConfigurationDocument: ConfigurationDocument;
    public category: Category;
    public field: FieldDefinition;
    public availableInputTypes: Array<InputType>;

    public hideable: boolean;
    public hidden: boolean;

    public editableLabel: I18nString;
    public editableDescription: I18nString;

    public saving: boolean;


    constructor(public activeModal: NgbActiveModal,
                private appConfigurator: AppConfigurator,
                private settingsProvider: SettingsProvider) {}


    public getCustomLanguageConfigurations = () => this.clonedConfigurationDocument.resource.languages;


    public getCustomCategoryDefinition(): CustomCategoryDefinition {

        return this.clonedConfigurationDocument.resource
            .categories[this.category.libraryId ?? this.category.name];
    }


    public initialize() {

        if (!this.getCustomCategoryDefinition().fields[this.field.name]) {
            this.getCustomCategoryDefinition().fields[this.field.name] = {};
        }

        this.editableLabel = LanguageConfigurationUtil.mergeCustomAndDefaultTranslations(
            this.getCustomLanguageConfigurations(), 'label', this.category, this.field
        );
        this.editableDescription = LanguageConfigurationUtil.mergeCustomAndDefaultTranslations(
            this.getCustomLanguageConfigurations(), 'description', this.category, this.field
        );

        this.hideable = this.isHideable();
        this.hidden = this.isHidden();
        this.saving = false;
    }


    public async save() {

        this.saving = true;

        if (isEmpty(this.getCustomCategoryDefinition().fields[this.field.name])) {
            delete this.getCustomCategoryDefinition().fields[this.field.name];
        }

        LanguageConfigurationUtil.updateCustomLanguageConfigurations(
            this.getCustomLanguageConfigurations(), this.editableLabel, this.editableDescription, this.category, this.field
        );

        try {
            const newProjectConfiguration: ProjectConfiguration = await this.appConfigurator.go(
                this.settingsProvider.getSettings().username,
                getConfigurationName(this.settingsProvider.getSettings().selectedProject),
                Document.clone(this.clonedConfigurationDocument)
            );
            this.activeModal.close({ 
                newProjectConfiguration,
                newCustomConfigurationDocument: this.clonedConfigurationDocument
            });
        } catch (err) {
            // TODO Error handling
            console.error(err);
        }
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
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
