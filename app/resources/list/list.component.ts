import {Component, Input, Output, EventEmitter} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ConfigLoader, IdaiType, ProjectConfiguration} from 'idai-components-2/configuration';
import {PersistenceManager, Validator} from 'idai-components-2/persist';
import {Messages} from 'idai-components-2/messages';
import {DocumentEditChangeMonitor} from 'idai-components-2/documents';
import {IdaiFieldDatastore} from '../../datastore/idai-field-datastore';
import {M} from '../../m';
import {SettingsService} from '../../settings/settings-service';
import {DoceditComponent} from '../../docedit/docedit.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'list',
    moduleId: module.id,
    templateUrl: './list.html'
})

/**
 * @author Fabian Z.
 * @author Thomas Kleinke
 */
export class ListComponent {

    @Input() documents: IdaiFieldDocument[];
    @Input() selectedDocument: IdaiFieldDocument;

    @Output() onDocumentCreation: EventEmitter<IdaiFieldDocument> = new EventEmitter<IdaiFieldDocument>();

    public typesMap: { [type: string]: IdaiType };
    public typesList: IdaiType[];

    private projectConfiguration: ProjectConfiguration;
    
    constructor(
        private messages: Messages,
        private persistenceManager: PersistenceManager,
        private settingsService: SettingsService,
        private modalService: NgbModal,
        private documentEditChangeMonitor: DocumentEditChangeMonitor,
        private validator: Validator,
        private datastore: IdaiFieldDatastore,
        configLoader: ConfigLoader
    ) {

        configLoader.getProjectConfiguration().then(projectConfiguration => {
            this.projectConfiguration = projectConfiguration;
            this.typesMap = projectConfiguration.getTypesMap();
        });
    }

    public save(document: IdaiFieldDocument) {

        if (!this.documentEditChangeMonitor.isChanged()) return;

        this.documentEditChangeMonitor.reset();

        const oldVersion = JSON.parse(JSON.stringify(document));

        this.validator.validate(document).then(
            () => {
                return this.persistenceManager.persist(document, this.settingsService.getUsername(), [oldVersion]);
            }).then(() => {
                this.messages.add([M.DOCEDIT_SAVE_SUCCESS]);
            }).catch(msgWithParams => {
                this.messages.add(msgWithParams);
                return this.restoreIdentifier(document);
            }).catch(msgWithParams => this.messages.add(msgWithParams));
    }

    public editDocument(doc: IdaiFieldDocument) {

        this.selectedDocument = doc;

        let detailModal
            = this.modalService.open(DoceditComponent, {size: 'lg', backdrop: 'static'}).componentInstance;
        detailModal.setDocument(doc);
    }

    public addRelatedDocument(parentDocument: IdaiFieldDocument, relation, event) {

        if (!parentDocument || !relation) return;

        event.target.value = '';

        let newDoc: IdaiFieldDocument
            = <IdaiFieldDocument> {'resource': { 'relations': {}, 'type': relation['targetName'] }, synced: 0 };

        let inverseRelationName = this.projectConfiguration.getInverseRelations(relation['name']);
        newDoc.resource.relations[inverseRelationName] = [parentDocument.resource.id];

        this.documents.push(newDoc);
        this.selectedDocument = newDoc;
        this.onDocumentCreation.emit(newDoc);
    }

    public markAsChanged() {

        this.documentEditChangeMonitor.setChanged();
    }

    private restoreIdentifier(document: IdaiFieldDocument): Promise<any> {

        return this.datastore.getLatestRevision(document.resource.id).then(
            latestRevision => {
                document.resource.identifier = latestRevision.resource.identifier;
            }
        );
    }

    private loadChildrenFor(doc: IdaiFieldDocument, ev) {
        let parentListIndex = this.documents.indexOf(doc);
        doc.resource.relations['records'].forEach( id => {
            this.datastore.get(id).then( doc => {

                this.documents.splice(parentListIndex+1,0, <IdaiFieldDocument>doc)
            }, msgWithParams => Promise.reject(msgWithParams))
        });
    }
}