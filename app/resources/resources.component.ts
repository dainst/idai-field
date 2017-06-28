import {Component, OnInit, AfterViewChecked} from '@angular/core';
import {ActivatedRoute, Params} from '@angular/router';
import {Location} from '@angular/common';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {Query} from 'idai-components-2/datastore';
import {Document, Relations, Action} from 'idai-components-2/core';
import {DocumentEditChangeMonitor} from 'idai-components-2/documents';
import {Messages} from 'idai-components-2/messages';
import {IdaiFieldDatastore} from '../datastore/idai-field-datastore';
import {Observable} from 'rxjs/Observable';
import {SettingsService} from '../settings/settings-service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {DoceditComponent} from '../docedit/docedit.component';


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
export class ResourcesComponent implements OnInit, AfterViewChecked {

    protected selectedDocument;
    protected observers: Array<any> = [];
    protected query: Query = {q: '', type: 'resource', prefix: true};

    public mode = 'map';
    public editGeometry = false;
    public documents: Array<Document>;

    public trenches: Array<IdaiFieldDocument>;
    public selectedTrench: IdaiFieldDocument;

    private ready: Promise<any>;
    private newDocumentsFromRemote: Array<Document> = [];
    private scrollTarget: IdaiFieldDocument;

    constructor(private route: ActivatedRoute,
                private location: Location,
                private datastore: IdaiFieldDatastore,
                private settingsService: SettingsService,
                private modalService: NgbModal,
                private documentEditChangeMonitor: DocumentEditChangeMonitor,
                private messages: Messages
    ) {

        let readyResolveFun: Function;
        this.ready = new Promise<any>(resolve => {
            readyResolveFun = resolve;
        });
        this.fetchDocuments().then(() => {
           readyResolveFun();
        });

        const self = this;
        datastore.documentChangesNotifications().subscribe(result => {
            self.handleChange(result);
        });

        this.fetchTrenches();
    }

    ngOnInit() {

        this.route.params.subscribe(params => {
            this.parseParams(params);
        });
    }

    ngAfterViewChecked() {

        if (this.scrollTarget) {
            this.scrollToDocument(this.scrollTarget);
            this.scrollTarget = undefined;
        }
    }

    private parseParams(params: Params) {

        let tab = params['tab'];
        let id = params['id'];

        if (!tab || !id) return;

        this.location.replaceState('resources');

        this.datastore.get(id).then(
            document => this.editDocument(document, tab),
            msgWithParams => this.messages.add(msgWithParams)
        );
    }

    public filterByTrench(event) {

        const trenchId: string = event.target.value;

        if (!trenchId || trenchId == '') {
            this.selectedTrench = undefined;
            this.fetchDocuments();
        } else {
            this.datastore.get(trenchId)
                .then(trench => {
                    this.selectedTrench = <IdaiFieldDocument> trench;
                    return this.datastore.findIsRecordedIn(trench.resource.id);
                }).then(documents => {
                    this.documents = documents as IdaiFieldDocument[];
                    this.notify();
                }).catch(err => { console.error(err); } );
        }
    }

    private handleChange(changedDocument: Document) {

        if (!this.documents || !this.isRemoteChange(changedDocument)) return;

        let existingDoc = false;

        for (let doc of this.documents) {
            if (!doc.resource || !changedDocument.resource) continue;
            if (!doc.resource.id || !changedDocument.resource.id) continue;
            if (doc.resource.id == changedDocument.resource.id) {
                doc['synced'] = changedDocument['synced'];
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

    public queryChanged(query: Query): Promise<any> {

        this.query = query;
        return this.fetchDocuments(query);
    }

    /**
     * @param documentToSelect
     */
    public setSelected(documentToSelect: Document): Document {

        this.selectedDocument = documentToSelect;
        this.notify();
        return this.selectedDocument;
    }

    /**
     * @returns {Document}
     */
    public getSelected(): IdaiFieldDocument {
        return this.selectedDocument;
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

    public createNewDocument(type: string, geometryType: string, relations: Relations = {}): Promise<any> {

        const newDocument: IdaiFieldDocument= <IdaiFieldDocument> {
            'resource': {
                'relations': relations,
                'type': type
            }
        };

        this.selectedDocument = newDocument;

        if (geometryType != 'none') {
            newDocument.resource['geometry'] = <IdaiFieldGeometry> { 'type': geometryType };
            this.editGeometry = true;
            this.mode = 'map';
        } else {
            this.editDocument();
        }

        return this.ready.then(() => {
            this.documents.unshift(<Document> newDocument);
            this.notify();
            return newDocument;
        });
    }

    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     * @param query
     */
    public fetchDocuments(query: Query = this.query): Promise<any> {

        this.newDocumentsFromRemote = [];

        return this.datastore.find(query).then(documents => {
            this.documents = documents as Document[];
            this.notify();
        }).catch(msgWithParams => this.messages.add(msgWithParams));
    }

    public editDocument(doc?: Document, activeTabName?: string) {

        this.editGeometry = false;
        if (doc) this.setSelected(doc);

        const doceditRef = this.modalService.open(DoceditComponent, {size: 'lg', backdrop: 'static'});
        const docedit = doceditRef.componentInstance;

        doceditRef.result.then(result => {
            this.fetchDocuments().then(
                () => {
                    this.fetchTrenches();
                    if (result.document) {
                        this.selectedDocument = result.document;
                        this.scrollTarget = result.document;
                    }
                }
            );
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

    private fetchTrenches(): Promise<any> {

        let tquery: Query = {q: '', type: 'trench', prefix: true};
        return this.datastore.find(tquery).then(documents => {
            this.trenches = documents as IdaiFieldDocument[];
        }).catch(msgWithParams => this.messages.add(msgWithParams));
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

    /**
     * Restores the selected document by resetting it
     * back to the persisted state. In case there are
     * any objects marked as changed which were not yet persisted,
     * they get deleted from the list.
     *
     * @returns {Promise<Document>} If the document was restored,
     *   it resolves to <code>document</code>, if it was not restored
     *   because it was an unsaved object, it resolves to <code>undefined</code>.
     *   If it could not get restored due to errors, it will reject with msgWithParams.
     */
    public restore(): Promise<any> {

        let document = this.selectedDocument;
        if (document == undefined) return Promise.resolve();
        if (!document['_id']) { // TODO work with propely defined interface
            this.remove(document);
            this.selectedDocument = undefined;
            return Promise.resolve();
        }

        return this.datastore.refresh(document).then(
            restoredObject => {
                this.replace(document, <Document> restoredObject);
                this.selectedDocument = restoredObject;
                return Promise.resolve(restoredObject);
            },
            msgWithParams => Promise.reject(msgWithParams)
        );
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
        if (mode == "list") {
            this.documents = [];
            this.fetchTrenches().then( () => {
                this.documents = this.trenches;
                this.notify();
            })
        } else {
            this.fetchDocuments();
        }

        this.editGeometry = false;
        this.mode = mode;
    }

    private removeEmptyDocuments() {

        if (!this.documents) return;

        for (let document of this.documents) {
            if (!document.resource.id) this.remove(document);
        }
    }
}
