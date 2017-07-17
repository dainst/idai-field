import {Component, AfterViewChecked} from '@angular/core';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {Location} from '@angular/common';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {Query} from 'idai-components-2/datastore';
import {Document, Action} from 'idai-components-2/core';
import {DocumentEditChangeMonitor} from 'idai-components-2/documents';
import {Messages} from 'idai-components-2/messages';
import {ConfigLoader, ViewDefinition} from 'idai-components-2/configuration';
import {IdaiFieldDatastore} from '../datastore/idai-field-datastore';
import {Observable} from 'rxjs/Observable';
import {SettingsService} from '../settings/settings-service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {DoceditComponent} from '../docedit/docedit.component';
import {ViewUtility} from '../util/view-utility';


@Component({
    moduleId: module.id,
    templateUrl: './resources.html'
})

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
export class ResourcesComponent implements AfterViewChecked {

    public view: ViewDefinition;
    public mainTypeLabel: string;
    public mode: string = 'map';
    public editGeometry: boolean = false;
    public query: Query = {q: '', type: 'resource', prefix: true};

    public documents: Array<Document>;
    public selectedDocument: Document;

    public mainTypeDocuments: Array<IdaiFieldDocument>;
    public selectedMainTypeDocument: IdaiFieldDocument;

    private ready: boolean = false;
    private newDocumentsFromRemote: Array<Document> = [];
    private scrollTarget: IdaiFieldDocument;
    private observers: Array<any> = [];
    private mainTypeObservers: Array<any> = [];

    constructor(private route: ActivatedRoute,
                private router: Router,
                private location: Location,
                private datastore: IdaiFieldDatastore,
                private settingsService: SettingsService,
                private modalService: NgbModal,
                private documentEditChangeMonitor: DocumentEditChangeMonitor,
                private messages: Messages,
                private configLoader: ConfigLoader,
                private viewUtility: ViewUtility
    ) {
        this.route.params.subscribe(params => {
            this.selectedDocument = undefined;
            this.selectedMainTypeDocument = undefined;
            this.mainTypeDocuments = undefined;
            this.ready = false;

            this.parseParams(params)
                .then(() => this.initialize())
                .catch(msgWithParams => {
                    if (msgWithParams) this.messages.add(msgWithParams)
                });
        });

        const self = this;
        datastore.documentChangesNotifications().subscribe(result => {
            self.handleChange(result);
        });
    }

    ngAfterViewChecked() {

        if (this.scrollTarget) {
            this.scrollToDocument(this.scrollTarget);
            this.scrollTarget = undefined;
        }
    }

    private parseParams(params: Params): Promise<any> {

        let viewName: string = params['view'];
        let resourceId: string = params['id'];
        let tab: string = params['tab'];

        if (resourceId) this.selectDocumentFromParams(resourceId, tab);

        this.location.replaceState('resources/' + viewName);

        if (!this.view || viewName != this.view.name) {
            return this.initializeView(viewName);
        } else {
            return Promise.resolve();
        }
    }

    public initialize(): Promise<any> {

        return this.fetchMainTypeDocuments()
            .then(() => this.fetchDocuments())
            .then(() => {
                this.ready = true;
                if (this.view.mainType == 'project') this.setMode('map');
                this.notifyMainTypeObservers();
            });
    }

    private initializeView(viewName: string): Promise<any> {

        return this.configLoader.getProjectConfiguration().then(
            projectConfiguration => {
                this.view = projectConfiguration.getView(viewName);
                this.mainTypeLabel = projectConfiguration.getLabelForType(this.view.mainType);
                Promise.resolve();
            }
        ).catch(() => { return Promise.reject(null); });
    }

    private selectDocumentFromParams(id: string, tab: string) {

        this.datastore.get(id).then(
            document => {
                if (tab) {
                    this.editDocument(document, tab);
                } else {
                    this.setSelected(document);
                }
            }, msgWithParams => this.messages.add(msgWithParams)
        );
    }

    public filterByMainTypeDocument(document: IdaiFieldDocument) {

        this.selectedMainTypeDocument = document;
        this.notifyMainTypeObservers();
        if (this.mode != 'list') {
            if (this.selectedDocument
                    && this.getMainTypeDocumentForDocument(this.selectedDocument) != this.selectedMainTypeDocument) {
                this.setSelected(undefined);
            }
            this.fetchDocuments();
        }
    }

    private handleChange(changedDocument: Document) {

        if (!this.documents || !this.isRemoteChange(changedDocument)) return;

        let existingDoc = false;

        for (let doc of this.documents) {
            if (!doc.resource || !changedDocument.resource) continue;
            if (!doc.resource.id || !changedDocument.resource.id) continue;
            if (doc.resource.id == changedDocument.resource.id) {
                existingDoc = true;
            }
        }

        if (!existingDoc) {
            let oldDocuments = this.documents;
            this.fetchDocuments().then(() => {
                for (let doc of this.documents) {
                    if (oldDocuments.indexOf(doc) == -1 && this.isRemoteChange(doc)) {
                        this.newDocumentsFromRemote.push(doc);
                    }
                }
            });
        }
    }

    /**
     * @param documentToSelect the object that should get selected
     */
    public select(documentToSelect: IdaiFieldDocument) {

        if (this.editGeometry && documentToSelect != this.selectedDocument) this.endEditGeometry();

        if (this.isNewDocumentFromRemote(documentToSelect)) {
            this.removeFromListOfNewDocumentsFromRemote(documentToSelect);
        }

        this.setSelected(documentToSelect);
    }

    public selectRelationTarget(documentToSelect: IdaiFieldDocument) {

        this.viewUtility.getViewNameForDocument(documentToSelect)
            .then(viewName => {
                if (viewName != this.view.name) {
                    return this.router.navigate(['resources', viewName, documentToSelect.resource.id]);
                } else {
                    this.select(documentToSelect);
                }
            });
    }

    /**
     * @param documentToSelect
     */
    public setSelected(documentToSelect: Document): Document {

        this.selectedDocument = documentToSelect;
        this.notify();

        if (this.selectedDocument) this.selectLinkedMainTypeDocumentForSelectedDocument();

        return this.selectedDocument;
    }

    /**
     * @returns {Document}
     */
    public getSelected(): Document {
        return this.selectedDocument;
    }

    public getSelectedMainTypeDocument(): Observable<IdaiFieldDocument> {

        return Observable.create(observer => {
            this.mainTypeObservers.push(observer);
            this.notifyMainTypeObservers();
        });
    }

    private selectLinkedMainTypeDocumentForSelectedDocument() {

        if (!this.mainTypeDocuments || this.mainTypeDocuments.length == 0) return;

        let mainTypeDocument = this.getMainTypeDocumentForDocument(this.selectedDocument);

        if (mainTypeDocument != this.selectedMainTypeDocument) {
            this.selectedMainTypeDocument = mainTypeDocument;
            this.fetchDocuments();
        }
    }

    private getMainTypeDocumentForDocument(document: Document): IdaiFieldDocument {

        if (!document.resource.relations['isRecordedIn']) return undefined;

        for (let documentId of document.resource.relations['isRecordedIn']) {
            for (let mainTypeDocument of this.mainTypeDocuments) {
                if (mainTypeDocument.resource.id == documentId) return mainTypeDocument;
            }
        }

        return undefined;
    }

    public queryChanged(query: Query): Promise<any> {

        this.query = query;
        return this.fetchDocuments(query);
    }

    public replace(document: Document,restoredObject: Document) {

        let index = this.documents.indexOf(document);
        this.documents[index] = restoredObject;
        this.notify();
    }

    public remove(document: Document) {

        const index = this.documents.indexOf(document);
        this.documents.splice(index, 1);
        this.notify();
    }

    public startEditNewDocument(newDocument: IdaiFieldDocument, geometryType: string) {

        this.removeEmptyDocuments();

        this.selectedDocument = newDocument;

        if (geometryType != 'none') {
            newDocument.resource['geometry'] = <IdaiFieldGeometry> { 'type': geometryType };
            this.editGeometry = true;
            this.mode = 'map';
        } else {
            this.editDocument();
        }

        if (newDocument.resource.type != this.view.mainType) {
            this.documents.unshift(<Document> newDocument);
            this.notify();
        }
    }

    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     * @param query
     */
    public fetchDocuments(query: Query = this.query): Promise<any> {

        this.newDocumentsFromRemote = [];

        query.constraints = {};
        if (this.view.mainType != 'project') {
            if (this.selectedMainTypeDocument) {
                query.constraints['resource.relations.isRecordedIn'] = this.selectedMainTypeDocument.resource.id;
            } else {
                this.documents = [];
                this.notify();
                return Promise.resolve();
            }
        } else {
            query.constraints['resource.relations.isRecordedIn'] = undefined;
        }

        return this.datastore.find(query)
            .then(documents => {
                return this.filterDocuments(documents);
            }).then(filteredDocuments => {
                this.documents = filteredDocuments;
                this.notify();
            }).catch(msgWithParams => this.messages.add(msgWithParams));
    }

    private filterDocuments(documents: Array<Document>): Promise<Array<Document>> {

        if (this.view.mainType != 'project') return Promise.resolve(documents);

        return this.configLoader.getProjectConfiguration()
            .then(projectConfiguration => {
                let result: Array<Document> = [];
                for (let document of documents) {
                    if (!projectConfiguration.isAllowedRelationDomainType(document.resource.type, this.view.mainType,
                            'isRecordedIn')) {
                        continue;
                    }
                    result.push(document);
                }
                return Promise.resolve(result);
            });
    }

    private fetchMainTypeDocuments(): Promise <any> {

        if (!this.view) return Promise.resolve();

        if (this.view.mainType == 'project') {
            this.selectedMainTypeDocument = undefined;
            return Promise.resolve();
        }

        const query: Query = {type: this.view.mainType, prefix: true};

        return this.datastore.find(query).then(documents => {
            this.mainTypeDocuments = documents as Array<IdaiFieldDocument>;
            if (this.mainTypeDocuments.length == 0) {
                this.selectedMainTypeDocument = undefined;
            } else if (this.selectedDocument) {
                this.selectedMainTypeDocument = this.getMainTypeDocumentForDocument(this.selectedDocument);
                if (!this.selectedMainTypeDocument) this.selectedMainTypeDocument = this.mainTypeDocuments[0];
            } else {
                this.selectedMainTypeDocument = this.mainTypeDocuments[0];
            }

        });
    }

    public editDocument(doc?: Document, activeTabName?: string) {

        this.editGeometry = false;
        if (doc) this.setSelected(doc);

        const doceditRef = this.modalService.open(DoceditComponent, { size: 'lg', backdrop: 'static' });
        const docedit = doceditRef.componentInstance;

        doceditRef.result.then(result => {
            this.fetchMainTypeDocuments().then(
                () => {
                    if (result.document && result.document.resource.type == this.view.mainType) {
                        this.selectedMainTypeDocument = result.document;
                    } else {
                        this.selectedDocument = result.document;
                        this.scrollTarget = result.document;
                    }
                    this.fetchDocuments();
                });
        }, closeReason => {
            this.fetchDocuments();
            this.documentEditChangeMonitor.reset();
            if (closeReason == 'deleted') this.selectedDocument = undefined;
        });

        docedit.setDocument(this.selectedDocument);

        if (activeTabName) {
            docedit.setActiveTab(activeTabName);
        }
    }

    public startEditGeometry() {
        this.editGeometry = true;
    }

    public endEditGeometry() {

        this.editGeometry = false;
        this.fetchDocuments();
    }

    public createGeometry(geometryType: string) {

        this.selectedDocument.resource['geometry'] = { 'type': geometryType };
        this.startEditGeometry();
    }

    public getDocuments(): Observable<Array<Document>> {
        return Observable.create(observer => {
            this.observers.push(observer);
            this.notify();
        });
    }

    private notify() {
        this.observers.forEach(observer => {
            observer.next(this.documents);
        });
    }

    private notifyMainTypeObservers() {
        this.mainTypeObservers.forEach(observer => {
            observer.next(this.selectedMainTypeDocument);
        });
    }

    public isNewDocumentFromRemote(document: Document) {

        return this.newDocumentsFromRemote.indexOf(document) > -1;
    }

    public removeFromListOfNewDocumentsFromRemote(document: Document) {

        let index = this.newDocumentsFromRemote.indexOf(document);
        if (index > -1) this.newDocumentsFromRemote.splice(index, 1);
    }

    private isRemoteChange(changedDocument: Document) {

        let latestAction: Action;

        if (changedDocument.modified && changedDocument.modified.length > 0) {
            latestAction = changedDocument.modified[changedDocument.modified.length - 1];
        } else {
            latestAction = changedDocument.created;
        }

        return latestAction && latestAction.user != this.settingsService.getUsername();
    }

    public solveConflicts(doc: IdaiFieldDocument) {
        this.editDocument(doc, 'conflicts');
    }

    public deselect() {
        this.selectedDocument = undefined;
    }

    public startEdit(doc: IdaiFieldDocument) {
        this.editDocument(doc);
    }

    public setScrollTarget(doc: IdaiFieldDocument) {
        this.scrollTarget = doc;
    }

    private scrollToDocument(doc: IdaiFieldDocument) {

        let element = document.getElementById('resource-' + doc.resource.identifier);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
    }

    public setMode(mode: string) {
        this.removeEmptyDocuments();
        if (mode != 'list') {
            this.fetchDocuments();
        }
        this.mode = mode;
        this.editGeometry = false;
    }

    private removeEmptyDocuments() {
        if (!this.documents) return;

        for (let document of this.documents) {
            if (!document.resource.id) this.remove(document);
        }
    }

    public documentsInclude(doc: IdaiFieldDocument): boolean {
        return this.documents.some(d => d.resource.id == doc.resource.id );

    }

}
