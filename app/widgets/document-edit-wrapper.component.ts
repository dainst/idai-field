import {Component, Input, Output, EventEmitter, ElementRef} from '@angular/core';
import {DocumentEditChangeMonitor} from 'idai-components-2/documents';
import {Messages} from 'idai-components-2/messages';
import {DatastoreErrors} from 'idai-components-2/datastore';
import {ConfigLoader, ProjectConfiguration, RelationDefinition} from 'idai-components-2/configuration';
import {Validator, PersistenceManager} from 'idai-components-2/persist';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {M} from '../m';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ImagePickerComponent} from './image-picker.component';
import {ConflictDeletedModalComponent} from './conflict-deleted-modal.component';
import {ConflictModalComponent} from './conflict-modal.component';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';
import {ImageGridBuilder} from '../common/image-grid-builder';
import {Imagestore} from '../imagestore/imagestore';
import {IdaiFieldDatastore} from '../datastore/idai-field-datastore';
import {SettingsService} from "../settings/settings-service";

@Component({
    selector: 'document-edit-wrapper',
    moduleId: module.id,
    templateUrl: './document-edit-wrapper.html'
})

/**
 * Uses the document edit form of idai-components-2 and adds styling
 * and save and back buttons. The save button is used to save and
 * validate the document.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DocumentEditWrapperComponent {

    @Input() document: IdaiFieldDocument;
    @Input() showBackButton: boolean = true;
    @Input() showDeleteButton: boolean = true;
    @Input() activeTab: string;
    @Output() onSaveSuccess = new EventEmitter<any>();
    @Output() onBackButtonClicked = new EventEmitter<any>();
    @Output() onDeleteSuccess = new EventEmitter<any>();

    private clonedDoc: IdaiFieldDocument;
    private projectImageTypes: any = {};
    private projectConfiguration: ProjectConfiguration;
    private typeLabel: string;
    private relationDefinitions: Array<RelationDefinition>;
    private imageGridBuilder : ImageGridBuilder;
    private rows = [];
    private imageDocuments: IdaiFieldImageDocument[];
    private inspectedRevisionsIds: string[];

    constructor(
        private messages: Messages,
        private persistenceManager: PersistenceManager,
        private validator: Validator,
        private documentEditChangeMonitor: DocumentEditChangeMonitor,
        private configLoader: ConfigLoader,
        private settingsService: SettingsService,
        private modalService: NgbModal,
        private imagestore: Imagestore,
        private datastore: IdaiFieldDatastore,
        private el: ElementRef
    ) {
        this.getProjectImageTypes();
        this.imageGridBuilder = new ImageGridBuilder(imagestore, true);
    }

    ngOnChanges() {

        this.configLoader.getProjectConfiguration().then(projectConfiguration => {
            this.projectConfiguration = projectConfiguration;

            this.inspectedRevisionsIds = [];

            if (this.document) {
                this.clonedDoc = this.cloneDoc(this.document);
                this.typeLabel = projectConfiguration.getLabelForType(this.document.resource.type);
                this.relationDefinitions = projectConfiguration.getRelationDefinitions(this.document.resource.type,
                    'editable');
                this.persistenceManager.setOldVersions([this.document]);

                if (this.document.resource.relations['depictedIn']) {
                    this.loadImages();   
                }

            }
        });
    }

    private calcGrid() {
        this.rows = [];
        this.imageGridBuilder.calcGrid(
            this.imageDocuments, 3, this.el.nativeElement.children[0].clientWidth).then(result=>{
            this.rows = result['rows'];
            for (var msgWithParams of result['msgsWithParams']) {
                this.messages.add(msgWithParams);
            }
        });
    }

    private loadImages() {
        var imageDocPromises = [];
        this.imageDocuments = [];
        this.document.resource.relations['depictedIn'].forEach(id => {
            imageDocPromises.push(this.datastore.get(id));
        });

        Promise.all(imageDocPromises).then( docs =>{
            this.imageDocuments = docs as IdaiFieldImageDocument[];
            this.calcGrid();
        });
    }

    public onResize() {
        this.calcGrid();
    }

    private getProjectImageTypes() {
        
        this.configLoader.getProjectConfiguration().then(projectConfiguration => {
            
            var projectTypesTree = projectConfiguration.getTypesTree();
    
            if (projectTypesTree["image"]) {
                this.projectImageTypes["image"] = projectTypesTree["image"];
    
                if(projectTypesTree["image"].children) {
                    for (var i = projectTypesTree["image"].children.length - 1; i >= 0; i--) {
                        this.projectImageTypes[projectTypesTree["image"].children[i].name] = projectTypesTree["image"].children[i];
                    }
                }
            }
        })
        
    }

    public save(viaSaveButton: boolean = false) {

        this.validator.validate(<IdaiFieldDocument> this.clonedDoc)
            .then(
                () => this.saveValidatedDocument(this.clonedDoc, viaSaveButton),
            ).then(
                () => this.messages.add([M.WIDGETS_SAVE_SUCCESS])
            ).catch(
                msgWithParams => {
                        if (msgWithParams) this.messages.add(msgWithParams);
                    }
            );
    }

    /**
     * @param clonedDoc
     * @param viaSaveButton
     * @returns {Promise<TResult>} in case of error, rejects with
     *   either with <code>msgWithParams</code> or with <code>undefined</code>,
     *   depending on whether the error get handled within the method.
     */
    private saveValidatedDocument(clonedDoc: IdaiFieldDocument, viaSaveButton: boolean): Promise<any> {

        return this.persistenceManager.persist(clonedDoc, this.settingsService.getUsername()).then(
            () => this.removeInspectedRevisions(),
            errorWithParams => this.handlePersistError(errorWithParams)
        ).then(
            () => this.datastore.getLatestRevision(this.clonedDoc.resource.id),
        ).then(
            doc => {
                this.clonedDoc = doc;
                this.documentEditChangeMonitor.reset();

                this.onSaveSuccess.emit({
                    document: clonedDoc,
                    viaSaveButton: viaSaveButton
                });
            }
        ).catch(msgWithParams => { return Promise.reject(msgWithParams); })
    }

    handlePersistError(errorWithParams) {
        if (errorWithParams[0] == DatastoreErrors.SAVE_CONFLICT) {
            this.handleSaveConflict();
        } else if (errorWithParams[0] == DatastoreErrors.DOCUMENT_DOES_NOT_EXIST_ERROR) {
            this.handleDeletedConflict();
        } else {
            console.error(errorWithParams);
            return Promise.reject([M.WIDGETS_SAVE_ERROR]);
        }
        return Promise.reject(undefined);
    }

    
    private removeInspectedRevisions(): Promise<any> {
        
        let promises = [];
        
        for (let revisionId of this.inspectedRevisionsIds) {
            promises.push(this.datastore.removeRevision(this.document.resource.id, revisionId));
        }

        this.inspectedRevisionsIds = [];

        return Promise.all(promises);
    }

    public openImagePicker() {

        this.modalService.open(ImagePickerComponent, {size: "lg"}).result.then(
            (selectedImages: IdaiFieldImageDocument[]) => {
                this.addDepictedInRelations(selectedImages);
                this.documentEditChangeMonitor.setChanged();
            }
        );
    }

    private handleDeletedConflict() {

        this.modalService.open(
            ConflictDeletedModalComponent, {size: "lg", windowClass: "conflict-deleted-modal"}
        ).result.then(decision => {
            console.log("decision on deleted conflict",decision);
        }).catch(() => {});
    }

    private handleSaveConflict() {

        this.modalService.open(
            ConflictModalComponent, {size: "lg", windowClass: "conflict-modal"}
        ).result.then(decision => {
            if (decision == 'overwrite') this.overwriteLatestRevision();
            else this.reloadLatestRevision();
        }).catch(() => {});
    }

    private overwriteLatestRevision() {

        this.datastore.getLatestRevision(this.clonedDoc.resource.id).then(latestRevision => {
            this.clonedDoc['_rev'] = latestRevision['_rev'];
            this.save(true);
        }).catch(() => this.messages.add([M.APP_GENERIC_SAVE_ERROR]));
    }

    private reloadLatestRevision() {

        this.datastore.getLatestRevision(this.clonedDoc.resource.id).then(latestRevision => {
            this.clonedDoc = <IdaiFieldDocument> latestRevision;
        }).catch(() => this.messages.add([M.APP_GENERIC_SAVE_ERROR]));
    }

    private addDepictedInRelations(imageDocuments: IdaiFieldImageDocument[]) {

        var relations = this.clonedDoc.resource.relations["depictedIn"]
            ? this.clonedDoc.resource.relations["depictedIn"].slice() : [];

        for (let i in imageDocuments) {
            if (relations.indexOf(imageDocuments[i].resource.id) == -1) {
                relations.push(imageDocuments[i].resource.id);
            }
        }

        this.clonedDoc.resource.relations["depictedIn"] = relations;

        this.loadImages();
    }

    public openDeleteModal(modal) {

        this.modalService.open(modal).result.then(result => {
            if (result == 'delete') this.delete();
        });
    }

    private delete() {

        return this.persistenceManager.remove(this.document).then(
            () => {
                this.onDeleteSuccess.emit();
                this.messages.add([M.WIDGETS_DELETE_SUCCESS]);
            },
            keyOfM => this.messages.add([keyOfM]));
    }

    private cloneDoc(doc: IdaiFieldDocument): IdaiFieldDocument {

        let clonedDoc = Object.assign({}, doc);
        clonedDoc.resource = Object.assign({}, doc.resource);

        return clonedDoc;
    }
}