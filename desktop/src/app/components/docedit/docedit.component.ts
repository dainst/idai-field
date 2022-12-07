import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { includedIn, isNot } from 'tsfun';
import { DatastoreErrors, Document, Datastore, Field, FieldDocument, Group, ImageDocument, CategoryForm,
    Name, ProjectConfiguration, Labels } from 'idai-field-core';
import { DoceditErrors } from './docedit-errors';
import { DocumentHolder } from './document-holder';
import { MenuContext } from '../../services/menu-context';
import { Menus } from '../../services/menus';
import { M } from '../messages/m';
import { Messages } from '../messages/messages';
import { Loading } from '../widgets/loading';
import { ConflictDeletedModalComponent } from './dialog/conflict-deleted-modal.component';
import { DuplicateModalComponent } from './dialog/duplicate-modal.component';
import { EditSaveDialogComponent } from '../widgets/edit-save-dialog.component';
import { MessagesConversion } from './messages-conversion';
import { MsgWithParams } from '../messages/msg-with-params';


@Component({
    selector: 'detail-modal',
    templateUrl: './docedit.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
        '(window:keyup)': 'onKeyUp($event)',
    }
})
/**
 * Uses the document edit forms of idai-field-core and adds styling
 * and navigation items like save and back buttons and modals
 * including the relevant functionality like validation,
 * persistence handling, conflict resolution etc.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DoceditComponent {

    public activeGroup: string;
    public fieldDefinitions: Array<Field>|undefined;
    public groups: Array<Group>|undefined;

    public parentLabel: string|undefined = undefined;
    public operationInProgress: 'save'|'duplicate'|'none' = 'none';
    private escapeKeyPressed = false;


    constructor(public activeModal: NgbActiveModal,
                public documentHolder: DocumentHolder,
                private messages: Messages,
                private modalService: NgbModal,
                private datastore: Datastore,
                public projectConfiguration: ProjectConfiguration,
                private loading: Loading,
                private menuService: Menus,
                public labels: Labels,
                private i18n: I18n) {}


    public isChanged = () => this.documentHolder.isChanged();

    public isLoading = () => this.loading.isLoading('docedit');

    public getFieldLabel: (_: string) => string;

    public getCategoryLabel = () => this.labels.get(this.projectConfiguration.getCategory(this.documentHolder.clonedDocument));


    public async onKeyDown(event: KeyboardEvent) {

        switch(event.key) {
            case 'Escape':
                await this.onEscapeKeyDown(event);
                break;
            case 's':
                if (event.ctrlKey || event.metaKey) await this.performQuickSave();
                break;
            case 'd':
                if (event.ctrlKey || event.metaKey) await this.openDuplicateModal();
                break;
        }
    }


    public onKeyUp(event: KeyboardEvent) {

        if (event.key === 'Escape') this.escapeKeyPressed = false;
    }


    public showDuplicateButton(): boolean {

        return this.documentHolder.clonedDocument !== undefined
            && this.documentHolder.clonedDocument.resource.category !== 'Project'
            && !this.projectConfiguration.isSubcategory(
                this.documentHolder.clonedDocument.resource.category, 'Image'
            );
    }


    public async setDocument(document: FieldDocument|ImageDocument) {

        this.documentHolder.setDocument(document);

        this.getFieldLabel = (fieldName: string) =>
            this.labels.getFieldLabel(this.projectConfiguration.getCategory(document), fieldName);

        this.parentLabel = await this.fetchParentLabel(document);
        this.updateFields();
    }


    public changeCategory(newCategory: string) {

        const { invalidFields, invalidRelations } = this.documentHolder.changeCategories(newCategory);
        this.showCategoryChangeFieldsWarning(invalidFields);
        this.showCategoryChangeRelationsWarning(newCategory, invalidRelations);
        this.updateFields();
    }


    public async cancel() {

        if (this.documentHolder.isChanged()) {
            await this.openEditSaveDialogModal();
        } else {
            this.activeModal.dismiss('cancel');
        }
    }


    public async openDuplicateModal() {

        this.menuService.setContext(MenuContext.MODAL);
        let numberOfDuplicates: number|undefined;

        try {
            const modalRef: NgbModalRef = this.modalService.open(
                DuplicateModalComponent, { keyboard: false, animation: false }
            );
            modalRef.componentInstance.initialize(!this.documentHolder.clonedDocument.resource.id);
            numberOfDuplicates = await modalRef.result;
        } catch (err) {
            // DuplicateModal has been canceled
        } finally {
            this.menuService.setContext(MenuContext.DOCEDIT);
        }

        if (numberOfDuplicates !== undefined) await this.save(numberOfDuplicates);
    }


    public async save(numberOfDuplicates?: number) {

        this.operationInProgress = numberOfDuplicates ? 'duplicate' : 'save';
        this.loading.start('docedit');

        const documentBeforeSave: Document = Document.clone(this.documentHolder.clonedDocument);

        try {
            const documentAfterSave: Document = numberOfDuplicates
                ? await this.documentHolder.duplicate(numberOfDuplicates)
                : await this.documentHolder.save();
            await this.handleSaveSuccess(documentBeforeSave, documentAfterSave, this.operationInProgress);
        } catch (errorWithParams) {
            await this.handleSaveError(
                errorWithParams.length > 0 && errorWithParams[0] === DoceditErrors.NOT_FOUND
                    ? M.DATASTORE_ERROR_NOT_FOUND
                    : errorWithParams);
        } finally {
            this.loading.stop('docedit');
            this.operationInProgress = 'none';
        }
    }


    private updateFields() {

        this.fieldDefinitions = CategoryForm.getFields(
            this.projectConfiguration.getCategory(this.documentHolder.clonedDocument)
        );
        this.groups = (this.projectConfiguration.getCategory(this.documentHolder.clonedDocument)).groups;
        if (!this.activeGroup && this.groups.length > 0) this.activeGroup = this.groups[0].name;
    }


    private async handleSaveSuccess(documentBeforeSave: Document, documentAfterSave: Document,
                                    operation: 'save'|'duplicate') {

        try {
            if (DoceditComponent.detectSaveConflicts(documentBeforeSave, documentAfterSave)) {
                this.handleSaveConflict(documentAfterSave);
            } else {
                await this.closeModalAfterSave(documentAfterSave.resource.id, operation);
            }
        } catch (msgWithParams) {
            this.messages.add(msgWithParams);
        }
    }


    private async handleSaveError(errorWithParams: any) {

        if (errorWithParams[0] === DatastoreErrors.DOCUMENT_NOT_FOUND) {
            await this.handleDeletedConflict();
            return undefined;
        }

        this.messages.add((errorWithParams.length > 0
            ? MessagesConversion.convertMessage(errorWithParams, this.projectConfiguration, this.labels)
            : [M.DOCEDIT_ERROR_SAVE]) as MsgWithParams);
    }


    private async onEscapeKeyDown(event: KeyboardEvent) {

        if (this.menuService.getContext() === MenuContext.DOCEDIT && !this.escapeKeyPressed) {
            if (event.srcElement) (event.srcElement as HTMLElement).blur();
            await this.cancel();
        } else {
            this.escapeKeyPressed = true;
        }
    }


    private async performQuickSave() {

        if (this.isChanged() && !this.isLoading() && this.menuService.getContext() === MenuContext.DOCEDIT) {
            await this.save();
        }
    }


    private async fetchParentLabel(document: FieldDocument|ImageDocument) {

        return !document.resource.relations.isRecordedIn
                || document.resource.relations.isRecordedIn.length === 0
            ? this.i18n({ id: 'docedit.parentLabel.project', value: 'Projekt' })
            : document.resource.id
                ? undefined
                : (await this.datastore.get(
                        document.resource.relations['liesWithin']
                            ? document.resource.relations['liesWithin'][0]
                            : document.resource.relations['isRecordedIn'][0]
                        )
                ).resource.identifier;
    }


    private async openEditSaveDialogModal() {

        this.menuService.setContext(MenuContext.MODAL);

        try {
            const modalRef: NgbModalRef = this.modalService.open(
                EditSaveDialogComponent, { keyboard: false, animation: false }
            );
            modalRef.componentInstance.changeMessage = this.i18n({
                id: 'docedit.saveModal.resourceChanged', value: 'Die Ressource wurde geändert.'
            });
            modalRef.componentInstance.escapeKeyPressed = this.escapeKeyPressed;

            const result: string = await modalRef.result;

            if (result === 'save') {
                await this.save();
            } else if (result === 'discard') {
                this.activeModal.dismiss('discard');
            }
        } catch(err) {
            // EditSaveDialogModal has been canceled
        } finally {
            this.menuService.setContext(MenuContext.DOCEDIT);
        }
    }


    private showCategoryChangeFieldsWarning(invalidFields: string[]) {

        if (invalidFields.length > 0) {
            this.messages.add([
                M.DOCEDIT_WARNING_CATEGORY_CHANGE_FIELDS,
                invalidFields
                    .map(this.getFieldLabel)
                    .reduce((acc, fieldLabel) => acc + ', ' + fieldLabel)
            ]);
        }
    }


    private showCategoryChangeRelationsWarning(newCategory: Name, invalidRelations: string[]) {

        const category = this.projectConfiguration.getCategory(newCategory);

        if (invalidRelations.length > 0) {
            this.messages.add([
                M.DOCEDIT_WARNING_CATEGORY_CHANGE_RELATIONS,
                invalidRelations
                    .map((relationName: string) => this.labels.getFieldLabel(category, relationName))
                    .reduce((acc, relationLabel) => acc + ', ' + relationLabel)
            ]);
        }
    }


    private async closeModalAfterSave(resourceId: string, operation: 'save'|'duplicate'): Promise<any> {

        this.activeModal.close({
            document: (await this.datastore.get(resourceId))
        });
    }


    private handleSaveConflict(documentAfterSave: Document) {

        this.documentHolder.setDocument(documentAfterSave);
        this.activeGroup = 'conflicts';
        this.messages.add([M.DOCEDIT_WARNING_SAVE_CONFLICT]);
    }


    private async handleDeletedConflict() {

        this.menuService.setContext(MenuContext.MODAL);

        try {
            await this.modalService.open(
                ConflictDeletedModalComponent,
                { windowClass: 'conflict-deleted-modal', keyboard: false, animation: false }
            ).result;
        } catch(err) {
            // ConflictDeletedModal has been canceled
        } finally {
            this.documentHolder.makeClonedDocAppearNew();
            this.menuService.setContext(MenuContext.DOCEDIT);
        }
    }


    private static detectSaveConflicts(documentBeforeSave: Document, documentAfterSave: Document): boolean {

        const conflictsBeforeSave: string[] = documentBeforeSave._conflicts;
        const conflictsAfterSave: string[] = documentAfterSave._conflicts;

        if (!conflictsBeforeSave && conflictsAfterSave && conflictsAfterSave.length >= 1) return true;
        if (!conflictsAfterSave) return false;

        return conflictsAfterSave.find(isNot(includedIn(conflictsBeforeSave))) !== undefined;
    }
}
