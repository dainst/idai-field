import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { clone } from 'tsfun';
import { ConfigurationDocument, I18N, Document, CategoryForm, CustomFormDefinition } from 'idai-field-core';
import { MenuContext } from '../../../services/menu-context';
import { Menus } from '../../../services/menus';
import { Messages } from '../../messages/messages';
import { EditSaveDialogComponent } from '../../widgets/edit-save-dialog.component';
import { ApplyChangesResult } from '../configuration.component';


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
        reindexConfiguration?: boolean) => Promise<ApplyChangesResult>;

    public applyingChanges: boolean;
    public escapeKeyPressed: boolean = false;

    protected abstract changeMessage: string;
    protected menuContext: MenuContext = MenuContext.CONFIGURATION_EDIT;


    constructor(public activeModal: NgbActiveModal,
                private modalService: NgbModal,
                private menuService: Menus,
                protected messages: Messages) {}


    public getClonedLanguageConfigurations = () => this.clonedConfigurationDocument.resource.languages;


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
    }


    public async confirm(reindexConfiguration?: boolean) {

        this.applyingChanges = true;
        this.updateCustomLanguageConfigurations();

        try {
            const result: ApplyChangesResult = await this.applyChanges(
                this.clonedConfigurationDocument,
                reindexConfiguration
            );
            this.activeModal.close(result);
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

        try {
            const modalRef: NgbModalRef = this.modalService.open(
                EditSaveDialogComponent, { keyboard: false }
            );
            modalRef.componentInstance.changeMessage = this.changeMessage;
            modalRef.componentInstance.escapeKeyPressed = this.escapeKeyPressed;

            const result: string = await modalRef.result;

            if (result === 'save') {
                await this.confirm();
            } else if (result === 'discard') {
                this.activeModal.dismiss('cancel');
            }
        } catch(err) {
            // EditSaveDialogModal has been canceled
        } finally {
            this.menuService.setContext(this.menuContext);
        }
    }


    protected abstract getLabel(): I18N.String;

    protected abstract getDescription(): I18N.String|undefined;

    protected abstract updateCustomLanguageConfigurations();
}
