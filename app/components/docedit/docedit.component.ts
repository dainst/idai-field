import {Component, TemplateRef, ViewChild} from '@angular/core';
import {NgbActiveModal, NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {DocumentEditChangeMonitor} from 'idai-components-2/documents';
import {Messages} from 'idai-components-2/messages';
import {DatastoreErrors} from 'idai-components-2/datastore';
import {ConfigLoader, ProjectConfiguration} from 'idai-components-2/configuration';
import {PersistenceManager, Validator} from 'idai-components-2/persist';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ConflictDeletedModalComponent} from './conflict-deleted-modal.component';
import {IdaiFieldDatastore} from '../../core/datastore/idai-field-datastore';
import {SettingsService} from '../../core/settings/settings-service';
import {ImageTypeUtility} from './image-type-utility';
import {Imagestore} from '../../core/imagestore/imagestore';
import {ObjectUtil} from '../../util/object-util';
import {M} from '../../m';
import {DoceditActiveTabService} from './docedit-active-tab-service';


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

    public isRecordedInResourcesCount: number;

    // used in template
    public showBackButton: boolean = true;

    private projectConfiguration: ProjectConfiguration;

    private projectImageTypes: any = {};

    /**
     * These are the revisions (of the cloned document as long as not saved)
     * that are conflict resolved. They will be be removed from document
     * as soon as it gets saved.
     */
    private inspectedRevisionsIds: string[];


    constructor(
        public activeModal: NgbActiveModal,
        public documentEditChangeMonitor: DocumentEditChangeMonitor,
        private messages: Messages,
        private persistenceManager: PersistenceManager,
        private validator: Validator,
        private settingsService: SettingsService,
        private modalService: NgbModal,
        private datastore: IdaiFieldDatastore,
        private imagestore: Imagestore,
        private imageTypeUtility: ImageTypeUtility,
        private activeTabService: DoceditActiveTabService,
        configLoader: ConfigLoader) {

        this.projectImageTypes = this.imageTypeUtility.getProjectImageTypes();

        (configLoader.getProjectConfiguration() as any)
            .then((projectConfiguration: ProjectConfiguration) => {
                this.projectConfiguration = projectConfiguration;
        });
    }


    /**
     * @param document
     */
    public setDocument(document: IdaiFieldDocument) {

        if (!document) return;

        this.document = document;
        this.inspectedRevisionsIds = [];
        this.clonedDocument = <IdaiFieldDocument> ObjectUtil.cloneObject(this.document);

        this.persistenceManager.setOldVersions([this.document]);

        this.datastore.find({ q: '', constraints: { 'resource.relations.isRecordedIn': document.resource.id }})
            .then(documents => this.isRecordedInResourcesCount = documents ? documents.length : 0);
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


    private showTypeChangeFieldsWarning() {

        const invalidFields: string[]
            = Validator.validateFields(this.clonedDocument.resource, this.projectConfiguration);

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
            = Validator.validateRelations(this.clonedDocument.resource, this.projectConfiguration);

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
            .catch(msgWithParams => this.messages.add(msgWithParams))
    }


    /**
     * Removes fields that have become invalid after a type change.
     */
    private removeInvalidFields() {

        const invalidFields: string[]
            = Validator.validateFields(this.clonedDocument.resource, this.projectConfiguration);

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
            = Validator.validateRelations(this.clonedDocument.resource, this.projectConfiguration);

        if (!invalidRelationFields) return;

        for (let relationFieldName of invalidRelationFields) {
            delete this.clonedDocument.resource.relations[relationFieldName];
        }
    }


    public showModal() {

        this.dialog = this.modalService.open(this.modalTemplate);
    }


    public openDeleteModal(modal: any) {

        this.modalService.open(modal).result.then(decision => {
            if (decision == 'delete') this.deleteDoc();
        });
    }


    public getRelationDefinitions() {

        if (!this.projectConfiguration) return undefined;

        return this.projectConfiguration.getRelationDefinitions(this.clonedDocument.resource.type, false, 'editable');
    }


    public cancel() {

        if (this.documentEditChangeMonitor.isChanged()) {
            this.showModal();
        } else {
            this.activeModal.dismiss('cancel');
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


    private handleSaveError(errorWithParams: any) {

        if (errorWithParams[0] == DatastoreErrors.DOCUMENT_NOT_FOUND) {
            this.handleDeletedConflict();
        } else {
            console.error(errorWithParams);
            return Promise.reject([M.DOCEDIT_SAVE_ERROR]);
        }
        return Promise.resolve(undefined);
    }


    private closeModalAfterSave(resourceId: string, viaSaveButton: boolean): Promise<any> {

        return this.datastore.get(resourceId)
            .then(document => {
                this.activeModal.close({
                    document: document,
                    viaSaveButton: viaSaveButton
                });
                this.messages.add([M.DOCEDIT_SAVE_SUCCESS]);
            });
    }


    /**
     * @param resourceId
     * @return {Promise<IdaiFieldDocument>} latest revision
     */
    private removeInspectedRevisions(resourceId: string): Promise<IdaiFieldDocument> {

        let promises = [];
        for (let revisionId of this.inspectedRevisionsIds) {
            promises.push(this.datastore.removeRevision(resourceId, revisionId));
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


    private deleteDoc() {

        this.removeImageWithImageStore(this.document)
            .then(() => this.removeWithPersistenceManager(this.document))
            .then(() => {
                this.activeModal.dismiss('deleted');
                this.messages.add([M.DOCEDIT_DELETE_SUCCESS]);
            })
            .catch(err => {
                this.messages.add(err);
            });
    }

    private removeImageWithImageStore(document: any): Promise<any> {

        if (this.imageTypeUtility.isImageType(document.resource.type)) {
            if (!this.imagestore.getPath()) return Promise.reject([M.IMAGESTORE_ERROR_INVALID_PATH_DELETE]);
            return this.imagestore.remove(document.resource.id).catch(() => {
                return [M.IMAGESTORE_ERROR_DELETE, document.resource.id];
            });
        } else {
            return Promise.resolve();
        }
    }

    private removeWithPersistenceManager(document: any): Promise<any> {

        return this.persistenceManager.remove(document, this.settingsService.getUsername())
            .catch((removeError:any):any => {
                if (removeError != DatastoreErrors.DOCUMENT_NOT_FOUND) {
                    return Promise.reject([M.DOCEDIT_DELETE_ERROR]);
                }
            });
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