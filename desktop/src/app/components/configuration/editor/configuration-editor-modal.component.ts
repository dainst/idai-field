import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AppConfigurator, Category, ConfigurationDocument, CustomCategoryDefinition, FieldDefinition,
    getConfigurationName, I18nString, ProjectConfiguration, Document } from 'idai-field-core';
import { clone } from 'tsfun';
import { LanguageConfigurationUtil } from '../../../core/configuration/language-configuration-util';
import { SettingsProvider } from '../../../core/settings/settings-provider';
import { MenuContext, MenuService } from '../../menu-service';
import { Messages } from '../../messages/messages';
import { EditSaveDialogComponent } from '../../widgets/edit-save-dialog.component';


/**
 * @author Thomas Kleinke
 */
export abstract class ConfigurationEditorModalComponent {

    public customConfigurationDocument: ConfigurationDocument;
    public category: Category;
    public field: FieldDefinition|undefined;

    public label: I18nString;
    public description: I18nString;
    public clonedLabel: I18nString;
    public clonedDescription: I18nString;
    public clonedConfigurationDocument: ConfigurationDocument;

    public saving: boolean;
    public escapeKeyPressed: boolean = false;

    protected abstract changeMessage: string;


    constructor(public activeModal: NgbActiveModal,
                private appConfigurator: AppConfigurator,
                private settingsProvider: SettingsProvider,
                private modalService: NgbModal,
                private menuService: MenuService,
                private messages: Messages) {}


    public getClonedLanguageConfigurations = () => this.clonedConfigurationDocument.resource.languages;


    public getClonedCategoryDefinition(): CustomCategoryDefinition {

        return this.clonedConfigurationDocument.resource
            .categories[this.category.libraryId ?? this.category.name];
    }


    public getCustomCategoryDefinition(): CustomCategoryDefinition {

        return this.customConfigurationDocument.resource
            .categories[this.category.libraryId ?? this.category.name];
    }


    public async onKeyDown(event: KeyboardEvent) {

        switch(event.key) {
            case 'Escape':
                await this.onEscapeKeyDown();
                break;
            case 's':
                if (event.ctrlKey || event.metaKey) await this.performQuickSave();
                break;
        }
    }


    public onKeyUp(event: KeyboardEvent) {

        if (event.key === 'Escape') this.escapeKeyPressed = false;
    }


    public initialize() {

        this.clonedConfigurationDocument = Document.clone(this.customConfigurationDocument);

        this.label = this.field ? this.field.label : this.category.label;
        this.description = this.field ? this.field.description : this.category.description;

        this.clonedLabel = clone(this.label);
        this.clonedDescription = clone(this.description);

        this.saving = false;
    }


    public async save() {

        this.saving = true;

        LanguageConfigurationUtil.updateCustomLanguageConfigurations(
            this.getClonedLanguageConfigurations(), this.clonedLabel, this.clonedDescription, this.category, this.field
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
        } catch (errWithParams) {
            // TODO Show user-readable error messages
            this.messages.add(errWithParams);
            this.saving = false;
        }
    }


    public cancel() {

        if (this.isChanged()) {
            this.openEditSaveDialogModal();
        } else {
            this.activeModal.dismiss('cancel');
        }
    }


    public abstract isChanged(): boolean;


    private async onEscapeKeyDown() {

        if (this.menuService.getContext() === MenuContext.CONFIGURATION_EDIT && !this.escapeKeyPressed) {
            if (event.srcElement) (event.srcElement as HTMLElement).blur();
            await this.cancel();
        } else {
            this.escapeKeyPressed = true;
        }
    }


    private async performQuickSave() {

        if (this.isChanged() && !this.saving && this.menuService.getContext() === MenuContext.CONFIGURATION_EDIT) {
            await this.save();
        }
    }


    private async openEditSaveDialogModal() {

        this.menuService.setContext(MenuContext.MODAL);

        try {
            const modalRef: NgbModalRef = this.modalService.open(
                EditSaveDialogComponent, { keyboard: false }
            );
            modalRef.componentInstance.changeMessage = this.changeMessage;
            modalRef.componentInstance.escapeKeyPressed = this.escapeKeyPressed;

            const result: string = await modalRef.result;

            if (result === 'save') {
                await this.save();
            } else if (result === 'discard') {
                this.activeModal.dismiss('cancel');
            }
        } catch(err) {
            // EditSaveDialogModal has been canceled
        } finally {
            this.menuService.setContext(MenuContext.CONFIGURATION_EDIT);
        }
    }
}
