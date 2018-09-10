import {Component} from '@angular/core';
import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {includedIn, isNot} from 'tsfun';
import {Document, Messages, IdaiFieldDocument, DatastoreErrors, IdaiFieldImageDocument, ProjectConfiguration}
    from 'idai-components-2';
import {ConflictDeletedModalComponent} from './dialog/conflict-deleted-modal.component';
import {clone} from '../../util/object-util';
import {DoceditActiveTabService} from './docedit-active-tab-service';
import {DeleteModalComponent} from './dialog/delete-modal.component';
import {EditSaveDialogComponent} from './dialog/edit-save-dialog.component';
import {DocumentDatastore} from '../../core/datastore/document-datastore';
import {DocumentHolder} from './document-holder';
import {TypeUtility} from '../../core/model/type-utility';
import {ValidationErrors} from '../../core/model/validation-errors';
import {M} from '../m';
import {ImportErrors} from '../../core/import/import-errors';


@Component({
    selector: 'detail-modal',
    moduleId: module.id,
    templateUrl: './docedit.html'
})
/**
 * Uses the document edit forms of idai-components-2 and adds styling
 * and navigation items like save and back buttons and modals
 * including the relevant functionality like validation,
 * persistence handling, conflict resolution etc.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DoceditComponent {

    private parentLabel: string|undefined = undefined;
    private showDoceditImagesTab: boolean = false;


    constructor(
        public activeModal: NgbActiveModal,
        private messages: Messages,
        private documentHolder: DocumentHolder,
        private modalService: NgbModal,
        private datastore: DocumentDatastore,
        private typeUtility: TypeUtility,
        private activeTabService: DoceditActiveTabService,
        private projectConfiguration: ProjectConfiguration) {
    }


    public isChanged = () => this.documentHolder.isChanged();

    public getFieldDefinitionLabel: (_: string) => string;


    public getRelationDefinitions = () => this.projectConfiguration.getRelationDefinitions(
        this.documentHolder.getClonedDocument().resource.type, false, 'editable');


    public getActiveTab() {

        return 'docedit-' + this.activeTabService.getActiveTab() + '-tab';
    }


    public changeActiveTab(event: any) {

        this.activeTabService.setActiveTab(event.nextId.replace('docedit-','').replace('-tab',''));
    };


    public async setDocument(document: IdaiFieldDocument|IdaiFieldImageDocument) {

        this.documentHolder.setClonedDocument(document);

        if (!document.resource.id) this.activeTabService.setActiveTab('fields');

        this.showDoceditImagesTab = (!
            (this.typeUtility.getSubtypes('Image'))[document.resource.type]
        );

        this.getFieldDefinitionLabel = (fieldName: string) =>
            this.projectConfiguration.getFieldDefinitionLabel(document.resource.type, fieldName);

        this.parentLabel = await this.fetchParentLabel(document);
    }


    public changeType(newType: string) {

        const {invalidFields, invalidRelations} = this.documentHolder.changeType(newType);
        this.showTypeChangeFieldsWarning(invalidFields);
        this.showTypeChangeRelationsWarning(invalidRelations);
    }


    public async cancel() {

        if (this.documentHolder.isChanged()) {
            await this.showModal();
        } else {
            this.activeModal.dismiss('cancel');
        }
    }


    public async openDeleteModal() {

        const ref = this.modalService.open(DeleteModalComponent);
        ref.componentInstance.setDocument(this.documentHolder.getClonedDocument());
        ref.componentInstance.setCount(await this.fetchIsRecordedInCount(this.documentHolder.getClonedDocument()));
        const decision = await ref.result;
        if (decision === 'delete') this.deleteDoc();
    }


    /**
     * @param viaSaveButton if true, it is assumed the call for save came directly
     *   via a user interaction.
     */
    public async save(viaSaveButton: boolean) {

        const documentBeforeSave: Document = clone(this.documentHolder.getClonedDocument());

        this.documentHolder.save().then(
            async (documentAfterSave: Document) => {
                await this.handleSaveSuccess(documentBeforeSave, documentAfterSave, viaSaveButton);
            }, msgWithParams => this.handleSaveError(msgWithParams)
        );
    }


    private async handleSaveSuccess(documentBeforeSave: Document, documentAfterSave: Document,
                                    viaSaveButton: boolean) {

        try {
            if (DoceditComponent.detectSaveConflicts(documentBeforeSave, documentAfterSave)) {
                this.handleSaveConflict(documentAfterSave);
            } else {
                await this.closeModalAfterSave(documentAfterSave.resource.id, viaSaveButton);
            }
        } catch (msgWithParams) {
            this.messages.add(msgWithParams);
        }
    }


    private async handleSaveError(errorWithParams: any) {

        if (errorWithParams[0] == DatastoreErrors.DOCUMENT_NOT_FOUND) {
            this.handleDeletedConflict();
            return undefined;
        } else if (errorWithParams.length > 0) {

            let replacement = undefined;
            if (errorWithParams[0] === ValidationErrors.IDENTIFIER_EXISTS) replacement = M.MODEL_VALIDATION_ERROR_IDEXISTS;
            // TODO this gets thrown if missing identifier, probably because this is detected first
            if (errorWithParams[0] === ValidationErrors.MISSING_PROPERTY) replacement = M.IMPORT_VALIDATION_ERROR_MISSINGPROPERTY;
            // if (errorWithParams[0] === ImportErrors.MISSING_IDENTIFIER) replacement = M.IMPORT_FAILURE_MISSING_IDENTIFIER;

            if (replacement) {
                errorWithParams[0] = replacement;
            }

            this.messages.add(errorWithParams);
        } else {
            console.error(errorWithParams);
            return [M.DOCEDIT_SAVE_ERROR];
        }
    }


    private async fetchParentLabel(document: IdaiFieldDocument|IdaiFieldImageDocument) {

        return !document.resource.relations.isRecordedIn
                || document.resource.relations.isRecordedIn.length === 0
            ? 'Projekt'
            : document.resource.id
                ? undefined
                : (await this.datastore.get(
                        document.resource.relations['liesWithin']
                            ? document.resource.relations['liesWithin'][0]
                            : document.resource.relations['isRecordedIn'][0]
                        )
                ).resource.identifier;
    }


    private async showModal() {

        try {
            if ((await this.modalService.open(EditSaveDialogComponent).result) === 'save') this.save(false);
        } catch (_) {
            this.activeModal.dismiss('discard');
        }
    }


    private async fetchIsRecordedInCount(document: Document): Promise<number> {

        return !document.resource.id
            ? 0
            : (await this.datastore.find(
                    { q: '', constraints: { 'isRecordedIn:contain': document.resource.id }} as any)
            ).documents.length;
    }


    private showTypeChangeFieldsWarning(invalidFields: string[]) {

        if (invalidFields.length > 0) {
            this.messages.add([
                M.DOCEDIT_TYPE_CHANGE_FIELDS_WARNING,
                invalidFields
                    .map(this.getFieldDefinitionLabel)
                    .reduce((acc, fieldLabel) => acc + ', ' + fieldLabel)
            ]);
        }
    }


    private showTypeChangeRelationsWarning(invalidRelations: string[]) {

        if (invalidRelations.length > 0) {
            this.messages.add([
                M.DOCEDIT_TYPE_CHANGE_RELATIONS_WARNING,
                invalidRelations
                    .map((relationName: string) => this.projectConfiguration.getRelationDefinitionLabel(relationName))
                    .reduce((acc, relationLabel) => acc + ', ' + relationLabel)
            ]);
        }
    }


    private async closeModalAfterSave(resourceId: string, viaSaveButton: boolean): Promise<any> {

        this.activeModal.close({
            document: (await this.datastore.get(resourceId)),
            viaSaveButton: viaSaveButton
        });
        this.messages.add([M.DOCEDIT_SAVE_SUCCESS]);
    }


    private async deleteDoc() {

        try {
            await this.documentHolder.remove();
            this.activeModal.dismiss('deleted');
            this.messages.add([M.DOCEDIT_DELETE_SUCCESS]);
        } catch(err) {
            this.messages.add(err);
        }
    }


    private handleSaveConflict(documentAfterSave: Document) {

        this.documentHolder.setClonedDocument(documentAfterSave);
        this.activeTabService.setActiveTab('conflicts');
        this.messages.add([M.DOCEDIT_SAVE_CONFLICT]);
    }


    private handleDeletedConflict() {

        this.modalService.open(
            ConflictDeletedModalComponent, {size: 'lg', windowClass: 'conflict-deleted-modal'}
        ).result.then(() => {
            this.documentHolder.makeClonedDocAppearNew();
        }).catch(() => {});
    }


    private static detectSaveConflicts(documentBeforeSave: Document, documentAfterSave: Document): boolean {

        const conflictsBeforeSave: string[] = (documentBeforeSave as any)['_conflicts'];
        const conflictsAfterSave: string[] =  (documentAfterSave as any)['_conflicts'];

        if (!conflictsBeforeSave && conflictsAfterSave && conflictsAfterSave.length >= 1) return true;
        if (!conflictsAfterSave) return false;

        return conflictsAfterSave.find(isNot(includedIn(conflictsBeforeSave))) != undefined;
    }
}