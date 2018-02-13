import {Component, TemplateRef, ViewChild} from '@angular/core';
import {NgbActiveModal, NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {DocumentEditChangeMonitor} from 'idai-components-2/documents';
import {Messages} from 'idai-components-2/messages';
import {DatastoreErrors} from 'idai-components-2/datastore';
import {ProjectConfiguration} from 'idai-components-2/configuration';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ConflictDeletedModalComponent} from './conflict-deleted-modal.component';
import {SettingsService} from '../../core/settings/settings-service';
import {ImageTypeUtility} from '../../common/image-type-utility';
import {Imagestore} from '../../core/imagestore/imagestore';
import {ObjectUtil} from '../../util/object-util';
import {M} from '../../m';
import {DoceditActiveTabService} from './docedit-active-tab-service';
import {PersistenceManager} from '../../core/persist/persistence-manager';
import {IdaiFieldDocumentDatastore} from '../../core/datastore/idai-field-document-datastore';
import {Validator} from '../../core/model/validator';
import {DoceditDeleteModalComponent} from './docedit-delete-modal.component';


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

    /**
     * The original unmodified version of the document
     */
    public document: IdaiFieldDocument;

    /**
     * Holds a cloned version of the <code>document</code> field,
     * on which changes can be made which can be either saved or discarded later.
     */
    private clonedDocument: IdaiFieldDocument;

    @ViewChild('modalTemplate') public modalTemplate: TemplateRef<any>;
    public dialog: NgbModalRef;

    private projectImageTypes: any = {};

    /**
     * These are the revisions (of the cloned document as long as not saved)
     * that are conflict resolved. They will be be removed from document
     * as soon as it gets saved.
     */
    private inspectedRevisionsIds: string[];

    private parentLabel: string;


    constructor(
        public activeModal: NgbActiveModal,
        public documentEditChangeMonitor: DocumentEditChangeMonitor,
        private messages: Messages,
        private persistenceManager: PersistenceManager,
        private validator: Validator,
        private settingsService: SettingsService,
        private modalService: NgbModal,
        private datastore: IdaiFieldDocumentDatastore,
        private imagestore: Imagestore,
        private imageTypeUtility: ImageTypeUtility,
        private activeTabService: DoceditActiveTabService,
        private projectConfiguration: ProjectConfiguration) {

        this.projectImageTypes = this.imageTypeUtility.getProjectImageTypes();
    }


    public getRelationDefinitions = () => this.projectConfiguration.getRelationDefinitions(
        this.clonedDocument.resource.type, false, 'editable');


    /**
     * @param document
     */
    public setDocument(document: IdaiFieldDocument) {

        if (!document) return;

        this.document = document;
        this.inspectedRevisionsIds = [];
        this.clonedDocument = <IdaiFieldDocument> ObjectUtil.cloneObject(this.document);

        this.persistenceManager.setOldVersions([this.document]);

        this.fetchIsRecordedInCount(document);

        this.fetchParentLabel(this.clonedDocument.resource.relations.liesWithin
            ? this.clonedDocument.resource.relations.liesWithin[0]
            : this.clonedDocument.resource.relations.isRecordedIn[0])
    }


    private fetchParentLabel(id: string) {

        this.datastore.get(id).then(doc =>
            this.parentLabel = doc.resource.identifier
        );
    }


    public changeActiveTab(event: any) {

        this.activeTabService.setActiveTab(
            event.nextId.replace('docedit-','').replace('-tab',''));
    };


    public changeType(newType: string) {

        this.clonedDocument.resource.type = newType;
        this.documentEditChangeMonitor.setChanged();
        this.showTypeChangeFieldsWarning();
        this.showTypeChangeRelationsWarning();
    }


    public showModal() {

        this.dialog = this.modalService.open(this.modalTemplate);
    }


    public async openDeleteModal() {

        const ref = this.modalService.open(DoceditDeleteModalComponent);
        ref.componentInstance.setDocument(this.document);
        ref.componentInstance.setCount(await this.fetchIsRecordedInCount(this.document));
        const decision = await ref.result;
        if (decision == 'delete') this.deleteDoc();
    }


    public cancel() {

        if (this.documentEditChangeMonitor.isChanged()) {
            this.showModal();
        } else {
            this.activeModal.dismiss('cancel');
        }
    }


    /**
     * @param viaSaveButton if true, it is assumed the call for save came directly
     *   via a user interaction.
     */
    public save(viaSaveButton: boolean = false) {

        this.removeInvalidFields();
        this.removeInvalidRelations();

        const documentBeforeSave: IdaiFieldDocument =
            <IdaiFieldDocument> ObjectUtil.cloneObject(this.clonedDocument);

        this.validator.validate(<IdaiFieldDocument> this.clonedDocument)
            .then(
                () => this.persistenceManager.persist(this.clonedDocument, this.settingsService.getUsername())
                    .then(
                        () => this.handleSaveSuccess(documentBeforeSave, viaSaveButton),
                        errorWithParams => this.handleSaveError(errorWithParams)
                    )
            )
            .catch((msgWithParams: any) => this.messages.add(msgWithParams))
    }


    private async fetchIsRecordedInCount(document: IdaiFieldDocument): Promise<number> {

        if (!document.resource.id) return 0;

        const result = await this.datastore.find({ q: '', constraints: { 'isRecordedIn:contain': document.resource.id }} as any);
        return result.documents ? result.documents.length : 0;
    }


    private showTypeChangeFieldsWarning() {

        const invalidFields: string[]
            = Validator.validateFields(this.clonedDocument.resource, this.projectConfiguration) as any;

        if (invalidFields && invalidFields.length > 0) {
            let invalidFieldsLabels: string[] = [];
            for (let fieldName of invalidFields) {
                invalidFieldsLabels.push(
                    this.projectConfiguration.getFieldDefinitionLabel(this.document.resource.type, fieldName));
            }

            this.messages.add([M.DOCEDIT_TYPE_CHANGE_FIELDS_WARNING, invalidFieldsLabels.join(', ')]);
        }
    }


    private showTypeChangeRelationsWarning() {

        const invalidRelationFields: string[]
            = Validator.validateRelations(this.clonedDocument.resource, this.projectConfiguration) as any;

        if (invalidRelationFields && invalidRelationFields.length > 0) {
            let invalidRelationFieldsLabels: string[] = [];
            for (let relationFieldName of invalidRelationFields) {
                invalidRelationFieldsLabels.push(
                    this.projectConfiguration.getRelationDefinitionLabel(relationFieldName));
            }

            this.messages.add([M.DOCEDIT_TYPE_CHANGE_RELATIONS_WARNING, invalidRelationFieldsLabels.join(', ')]);
        }
    }


    /**
     * Removes fields that have become invalid after a type change.
     */
    private removeInvalidFields() {

        const invalidFields: string[]
            = Validator.validateFields(this.clonedDocument.resource, this.projectConfiguration) as any;

        if (!invalidFields) return;

        for (let fieldName of invalidFields) {
            delete this.clonedDocument.resource[fieldName];
        }
    }


    /**
     * Removes relation fields that have become invalid after a type change.
     */
    private removeInvalidRelations() {

        const invalidRelationFields: string[]
            = Validator.validateRelations(this.clonedDocument.resource, this.projectConfiguration) as any;

        if (!invalidRelationFields) return;

        for (let relationFieldName of invalidRelationFields) {
            delete this.clonedDocument.resource.relations[relationFieldName];
        }
    }


    private handleSaveSuccess(documentBeforeSave: IdaiFieldDocument, viaSaveButton: boolean) {

        this.removeInspectedRevisions(this.clonedDocument.resource.id as any)
            .then(latestRevision => {
                this.clonedDocument = latestRevision;
                this.documentEditChangeMonitor.reset();

                if (DoceditComponent.detectSaveConflicts(documentBeforeSave, latestRevision)) {
                    this.activeTabService.setActiveTab('conflicts');
                    this.messages.add([M.DOCEDIT_SAVE_CONFLICT]);
                } else {
                    return this.closeModalAfterSave(latestRevision.resource.id as any, viaSaveButton);
                }
            }).catch(msgWithParams => {
                this.messages.add(msgWithParams);
            });
    }


    private async handleSaveError(errorWithParams: any) {

        if (errorWithParams[0] == DatastoreErrors.DOCUMENT_NOT_FOUND) {
            this.handleDeletedConflict();
            return undefined;
        } else {
            console.error(errorWithParams);
            return [M.DOCEDIT_SAVE_ERROR];
        }
    }


    private async closeModalAfterSave(resourceId: string, viaSaveButton: boolean): Promise<any> {

        this.activeModal.close({
            document: (await this.datastore.get(resourceId)),
            viaSaveButton: viaSaveButton
        });
        this.messages.add([M.DOCEDIT_SAVE_SUCCESS]);
    }


    /**
     * @param resourceId
     * @return {Promise<IdaiFieldDocument>} latest revision
     */
    private removeInspectedRevisions(resourceId: string): Promise<IdaiFieldDocument> {

        let promises = [] as any;
        for (let revisionId of this.inspectedRevisionsIds) {
            promises.push(this.datastore.removeRevision(resourceId, revisionId) as never);
        }
        this.inspectedRevisionsIds = [];

        return Promise.all(promises)
            .catch(() => Promise.reject([M.DATASTORE_GENERIC_ERROR]))
            .then(() => this.datastore.get(resourceId, { skip_cache: true}))
            .catch(() => Promise.reject([M.DATASTORE_NOT_FOUND]))
    }


    private handleDeletedConflict() {

        this.modalService.open(
            ConflictDeletedModalComponent, {size: 'lg', windowClass: 'conflict-deleted-modal'}
        ).result.then(() => {
            this.makeClonedDocAppearNew();
        }).catch(() => {});
    }


    private makeClonedDocAppearNew() {

        // make the doc appear 'new' ...
        delete this.clonedDocument.resource.id; // ... for persistenceManager
        delete (this.clonedDocument as any)['_id'];      // ... for pouchdbdatastore
        delete (this.clonedDocument as any)['_rev'];
    }


    private async deleteDoc() {

        await this.removeImageWithImageStore(this.document);
        await this.removeWithPersistenceManager(this.document);

        try {
            this.activeModal.dismiss('deleted');
            this.messages.add([M.DOCEDIT_DELETE_SUCCESS]);
        } catch(err) {
            this.messages.add(err);
        }
    }


    private async removeImageWithImageStore(document: any): Promise<any> {

        if (!this.imageTypeUtility.isImageType(document.resource.type)) return undefined;

        if (!this.imagestore.getPath()) throw [M.IMAGESTORE_ERROR_INVALID_PATH_DELETE];
        try {
            await this.imagestore.remove(document.resource.id);
        } catch (_) {
            return [M.IMAGESTORE_ERROR_DELETE, document.resource.id];
        }
    }


    private async removeWithPersistenceManager(document: any): Promise<any> {

        try {
            await this.persistenceManager.remove(document, this.settingsService.getUsername())
        } catch(removeError) {
            if (removeError != DatastoreErrors.DOCUMENT_NOT_FOUND) {
                throw [M.DOCEDIT_DELETE_ERROR];
            }
        }
    }


    private static detectSaveConflicts(documentBeforeSave: IdaiFieldDocument,
                                       documentAfterSave: IdaiFieldDocument): boolean {

        const conflictsBeforeSave: string[] = (documentBeforeSave as any)['_conflicts'];
        const conflictsAfterSave: string[] =  (documentAfterSave as any)['_conflicts'];

        if (!conflictsBeforeSave && conflictsAfterSave && conflictsAfterSave.length >= 1) return true;
        if (!conflictsAfterSave) return false;

        for (let conflict of conflictsAfterSave) {
            if (conflictsBeforeSave.indexOf(conflict) == -1) {
                return true;
            }
        }

        return false;
    }
}