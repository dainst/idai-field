import {Component} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Query, Datastore} from 'idai-components-2/datastore';
import {Document, Action} from 'idai-components-2/core';
import {DocumentEditChangeMonitor} from 'idai-components-2/documents';
import {Observable} from 'rxjs/Observable';
import {SettingsService} from '../settings/settings-service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {EditModalComponent} from '../widgets/edit-modal.component';

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
export class ResourcesComponent {

    protected selectedDocument;
    protected observers: Array<any> = [];
    protected query: Query = {q: '', type: 'resource', prefix: true};

    public documents: Array<Document>;
    private newDocumentsFromRemote: Array<Document> = [];
    private ready: Promise<any>;
    private mode = "map";
    private editGeometry = false;

    constructor(private route: ActivatedRoute,
                private datastore: Datastore,
                private settingsService: SettingsService,
                private modalService: NgbModal,
                private documentEditChangeMonitor: DocumentEditChangeMonitor
    ) {

        let readyResolveFun: Function;
        this.ready = new Promise<any>(resolve=>{
            readyResolveFun = resolve;
        });
        this.fetchDocuments().then(()=>{
           readyResolveFun();
        });

        const self = this;
        datastore.documentChangesNotifications().subscribe(result => {
            self.handleChange(result);
        });
    }

    ngOnInit(): void {
        console.log(this.route);
        if (this.route.params["value"]["id"]) {
            this.loadDoc(this.route.params["value"]["id"])
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
     * @param documentToSelect the object that should get selected if the preconditions
     *   to change the selection are met.
     */
    public select(documentToSelect: IdaiFieldDocument) {
        if (this.editGeometry) this.endEditGeometry();

        if (this.isNewDocumentFromRemote(documentToSelect)) {
            this.removeFromListOfNewDocumentsFromRemote(documentToSelect);
        }

        this.setSelected(documentToSelect);
    }

    public queryChanged(query: Query): Promise<any> {

        return new Promise<any>((resolve) => {
            this.query = query;
            this.fetchDocuments(query).then(
                () => {
                    if (this.selectedDocument && this.documents.indexOf(this.selectedDocument) == -1) {
                        //this.router.navigate(['resources']);
                    }
                    resolve();
                }
            );
        });
    }

    /**
     * @param documentToSelect
     */
    public setSelected(documentToSelect: Document): Document {
        this.selectedDocument = documentToSelect;
        this.notify();
        return this.selectedDocument
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

        var index = this.documents.indexOf(document);
        this.documents.splice(index, 1);
        this.notify();
    }

    public createNewDocument(type: string, geometryType: string): Promise<any> {
        // var newDocument : IdaiFieldDocument = TODO this does not work for some reason.
        //     { "synced" : 1, "resource" :
        //     { "type" : undefined, "identifier":"hallo","title":undefined}};

        var newDocument = { "resource": { "relations": {}, "type": type,  } };
        this.selectedDocument = newDocument;

        if(geometryType != "none") {
            newDocument.resource["geometry"] = { "type": geometryType };
            this.editGeometry = true;
            this.mode = "map";
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
        });
    }

    public editDocument(doc?: IdaiFieldDocument, activeTabName?: string) {

        this.editGeometry = false;
        if (doc) this.setSelected(doc);

        var detailModalRef = this.modalService.open(EditModalComponent, {size: 'lg', backdrop: 'static'});
        var detailModal = detailModalRef.componentInstance;

        detailModalRef.result.then(result => {
            this.fetchDocuments();
            if (result.document) this.selectedDocument = result.document;
        }, closeReason => {
            this.fetchDocuments();
            this.documentEditChangeMonitor.reset();
            if (closeReason == 'deleted') this.selectedDocument = undefined;
        });

        if (this.selectedDocument.resource.id) detailModal.showDeleteButton();
        detailModal.setDocument(this.selectedDocument);

        if (activeTabName) {
            detailModal.setActiveTab(activeTabName);
        }
    }

    public startEditGeometry() {
        this.editGeometry = true;
    }

    public endEditGeometry() {
        this.editGeometry = false;
        this.fetchDocuments();
    }

    public createPolygon(doc?: IdaiFieldDocument) {

        if (doc) this.setSelected(doc);
        this.selectedDocument.resource['geometry'] = { 'type': 'Polygon' };
        this.startEditGeometry();
    }

    public createPoint(doc?: IdaiFieldDocument) {

        if (doc) this.setSelected(doc);
        this.selectedDocument.resource['geometry'] = { 'type': 'Point' };
        this.startEditGeometry();
    }

    public createPolyline(doc?: IdaiFieldDocument) {

        if (doc) this.setSelected(doc);
        this.selectedDocument.resource['geometry'] = { 'type': 'LineString' };
        this.startEditGeometry();
    }

    /**
     * Gets a document from the datastore and makes
     * it the current selection.
     *
     * @param resourceId
     * @returns {Promise<Document>}
     */
    public loadDoc(resourceId) : Promise<Document> {
        return this.datastore.get(resourceId)
            .then(document => this.setSelected(document));
    }

    public getDocuments() : Observable<Array<Document>> {
        return Observable.create( observer => {
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
        this.editDocument(doc, "conflicts");
    }

    public deselect() {
        this.selectedDocument = undefined;
    }

    public startEdit(doc: IdaiFieldDocument) {
        this.editDocument(doc);
    }
}
