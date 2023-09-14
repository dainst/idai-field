import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { clone, nop } from 'tsfun';
import { ConfigurationDocument, I18N, Document, CategoryForm, CustomFormDefinition } from 'idai-field-core';
import { MenuContext } from '../../../services/menu-context';
import { Menus } from '../../../services/menus';
import { Messages } from '../../messages/messages';
import { EditSaveDialogComponent } from '../../widgets/edit-save-dialog.component';
import { Modals } from '../../../services/modals';
import { AngularUtility } from '../../../angular/angular-utility';


/**
 * @author Thomas Kleinke
 */
export abstract class ConfigurationEditorModalComponent {

    public configurationDocument: ConfigurationDocument;
    public category: CategoryForm;
    public new: boolean = false;

    public label: I18N.String;
    public description?: I18N.String;
    public clonedLabel: I18N.String;
    public clonedDescription?: I18N.String;
    public clonedConfigurationDocument: ConfigurationDocument;

    public applyChanges: (configurationDocument: ConfigurationDocument,
        reindexConfiguration?: boolean) => Promise<ConfigurationDocument>;

    public applyingChanges: boolean;
    public escapeKeyPressed: boolean = false;

    protected abstract changeMessage: string;
    protected menuContext: MenuContext = MenuContext.CONFIGURATION_EDIT;


    constructor(public activeModal: NgbActiveModal,
                protected modals: Modals,
                private menuService: Menus,
                protected messages: Messages) {}


    public getClonedLanguageConfigurations = () => this.clonedConfigurationDocument.resource.languages;

    public getClonedProjectLanguages = () => this.clonedConfigurationDocument.resource.projectLanguages;


    public getClonedFormDefinition(): CustomFormDefinition {

        return this.clonedConfigurationDocument.resource
            .forms[this.category.libraryId ?? this.category.name];
    }


    public getCustomFormDefinition(): CustomFormDefinition {

        return this.configurationDocument.resource
            .forms[this.category.libraryId ?? this.category.name];
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

        this.clonedConfigurationDocument = Document.clone(this.configurationDocument);

        this.label = this.getLabel();
        this.description = this.getDescription();

        this.clonedLabel = clone(this.label);
        this.clonedDescription = this.description ? clone(this.description) : {};

        this.applyingChanges = false;

        AngularUtility.blurActiveElement();
    }


    public async confirm(reindexConfiguration?: boolean) {

        this.applyingChanges = true;
        this.updateCustomLanguageConfigurations();

        try {
            const changedConfigurationDocument: ConfigurationDocument = await this.applyChanges(
                this.clonedConfigurationDocument,
                reindexConfiguration
            );
            this.activeModal.close(changedConfigurationDocument);
        } catch (errWithParams) {
            // TODO Show user-readable error messages
            this.messages.add(errWithParams);
            this.applyingChanges = false;
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

        if (this.menuService.getContext() === this.menuContext && !this.escapeKeyPressed) {
            if (event.srcElement) (event.srcElement as HTMLElement).blur();
            await this.cancel();
        } else {
            this.escapeKeyPressed = true;
        }
    }


    private async performQuickSave() {

        if (this.isChanged() && !this.applyingChanges && this.menuService.getContext() === this.menuContext) {
            await this.confirm();
        }
    }


    private async openEditSaveDialogModal() {

        this.menuService.setContext(MenuContext.CONFIGURATION_MODAL);

        const [result, componentInstance] = this.modals.make<EditSaveDialogComponent>(
            EditSaveDialogComponent,
            MenuContext.CONFIGURATION_MODAL
        );

        componentInstance.changeMessage = this.changeMessage;
        componentInstance.escapeKeyPressed = this.escapeKeyPressed;
        componentInstance.applyMode = true;

        await this.modals.awaitResult(
            result,
            async (resultMessage: string) => {
                if (resultMessage === 'save') {
                    await this.confirm();
                } else if (resultMessage === 'discard') {
                    this.activeModal.dismiss('cancel');
                }
            },
            nop
        );
    }


    protected abstract getLabel(): I18N.String;

    protected abstract getDescription(): I18N.String|undefined;

    protected abstract updateCustomLanguageConfigurations();
}
