import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { includedIn, isNot } from 'tsfun';
import { DatastoreErrors, Document, Datastore, Field, FieldDocument, Group, ImageDocument, CategoryForm,
    Name, ProjectConfiguration, Labels, Resource } from 'idai-field-core';
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
    public identifierPrefix: string|undefined;
    public scrollTargetField: string;

    public parentLabel: string|undefined = undefined;
    public resourceLabel: string;
    public resourceSubLabel: string;

    public maxNumberOfDuplicates: number;

    public operationInProgress: 'save'|'duplicate'|'none' = 'none';
    private escapeKeyPressed = false;


    constructor(public documentHolder: DocumentHolder,
                public projectConfiguration: ProjectConfiguration,
                private activeModal: NgbActiveModal,
                private messages: Messages,
                private modalService: NgbModal,
                private datastore: Datastore,
                private labels: Labels,
                private loading: Loading,
                private menuService: Menus) {}


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
                this.documentHolder.clonedDocument.resource.category, 'Image')
            && (this.documentHolder.isNewDocument()
                ? this.maxNumberOfDuplicates > 1
                : this.maxNumberOfDuplicates > 0);
    }


    public getResourceLabel(): string {

        const resource: Resource = this.documentHolder.clonedDocument.resource;
        const identifier: string = resource.identifier;

        if (this.documentHolder.clonedDocument.resource.category === 'Project') {
            const name: string = this.labels.getFromI18NString(resource.shortName);
            return name ?? identifier;
        } else {
            return identifier;
        }
    }


    public getResourceSubLabel(): string {

        const resourceLabel: string = this.getResourceLabel();

        return !resourceLabel || resourceLabel !== this.documentHolder.clonedDocument.resource.identifier
            ? this.documentHolder.clonedDocument.resource.identifier
            : '';
    }


    public async setDocument(document: FieldDocument|ImageDocument) {

        this.documentHolder.setDocument(document);

        this.getFieldLabel = (fieldName: string) =>
            this.labels.getFieldLabel(this.projectConfiguration.getCategory(document), fieldName);

        this.parentLabel = await this.fetchParentLabel(document);
        this.updateFields();
        this.maxNumberOfDuplicates = await this.computeMaxNumberOfDuplicates();
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
            modalRef.componentInstance.initialize(this.documentHolder.isNewDocument());
            modalRef.componentInstance.maxNumberOfDuplicates = this.maxNumberOfDuplicates;
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

        const category: CategoryForm = this.projectConfiguration.getCategory(this.documentHolder.clonedDocument);

        this.fieldDefinitions = CategoryForm.getFields(category);
        this.groups = category.groups;
        if (!this.activeGroup && this.groups.length > 0) this.activeGroup = this.groups[0].name;
        this.identifierPrefix = category.identifierPrefix;
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

        if (errorWithParams.length > 0) {
            if (errorWithParams[0] === DatastoreErrors.GENERIC_ERROR && errorWithParams.length > 1) {
                console.error(errorWithParams[1]);
            }
            this.messages.add(
                MessagesConversion.convertMessage(errorWithParams, this.projectConfiguration, this.labels)
            );
        } else {
            console.error(errorWithParams);
            this.messages.add([M.DOCEDIT_ERROR_SAVE]);
        }
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


    private async fetchParentLabel(document: FieldDocument|ImageDocument): Promise<string|undefined> {

        return !document.resource.relations.isRecordedIn
                || document.resource.relations.isRecordedIn.length === 0
            ? $localize `:@@docedit.parentLabel.project:Projekt`
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
            modalRef.componentInstance.changeMessage
                = $localize `:@@docedit.saveModal.resourceChanged:Die Ressource wurde geändert.`;
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


    private async computeMaxNumberOfDuplicates(): Promise<number> {

        const category: CategoryForm = this.projectConfiguration.getCategory(
            this.documentHolder.clonedDocument.resource.category
        );

        if (category.resourceLimit) {
            const resourcesCount: number = await this.datastore.findIds({ categories: [category.name] }).totalCount;
            return Math.max(0, category.resourceLimit - resourcesCount);
        } else {
            return 100;
        }
    }


    private static detectSaveConflicts(documentBeforeSave: Document, documentAfterSave: Document): boolean {

        const conflictsBeforeSave: string[] = documentBeforeSave._conflicts;
        const conflictsAfterSave: string[] = documentAfterSave._conflicts;

        if (!conflictsAfterSave) return false;
        if (!conflictsBeforeSave && conflictsAfterSave?.length) return true;

        return conflictsAfterSave.find(isNot(includedIn(conflictsBeforeSave))) !== undefined;
    }
}
