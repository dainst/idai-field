import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConfigurator, Category, ConfigurationDocument, CustomCategoryDefinition, FieldDefinition,
    getConfigurationName, I18nString, ProjectConfiguration, Document } from 'idai-field-core';
import { LanguageConfigurationUtil } from '../../core/configuration/language-configuration-util';
import { SettingsProvider } from '../../core/settings/settings-provider';


/**
 * @author Thomas Kleinke
 */
export abstract class ConfigurationEditorModalComponent {

    public clonedConfigurationDocument: ConfigurationDocument;
    public category: Category;
    public field: FieldDefinition|undefined;

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

        this.editableLabel = LanguageConfigurationUtil.mergeCustomAndDefaultTranslations(
            this.getCustomLanguageConfigurations(), 'label', this.category, this.field
        );
        this.editableDescription = LanguageConfigurationUtil.mergeCustomAndDefaultTranslations(
            this.getCustomLanguageConfigurations(), 'description', this.category, this.field
        );

        this.saving = false;
    }


    public async save() {

        this.saving = true;

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
}
