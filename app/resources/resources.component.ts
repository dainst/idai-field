import {Component, Inject} from "@angular/core";
import {Router} from "@angular/router";
import {IdaiFieldDocument} from "../model/idai-field-document";
import {Query, Datastore} from "idai-components-2/datastore";
import {Document} from "idai-components-2/core";
import {ConfigLoader} from "idai-components-2/configuration";
import {Observable} from "rxjs/Observable";
import {FilterUtility} from '../util/filter-utility';

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

    public documents: Document[];
    private ready: Promise<any>;

    constructor(private router: Router,
                private datastore: Datastore) {

        let readyResolveFun: Function;
        this.ready = new Promise<any>(resolve=>{
            readyResolveFun = resolve;
        });
        this.fetchDocuments().then(()=>{
           readyResolveFun();
        });

        const self = this;
        datastore.documentChangesNotifications().subscribe(result=>{
            if (!self.documents) return;
            for (let doc of self.documents) {
                if (!doc.resource || !result.resource) continue;
                if (!doc.resource.id || !result.resource.id) continue;
                if (doc.resource.id == result.resource.id) {
                    doc['synced'] = result['synced'];
                }
            }

        });
    }

    /**
     * @param documentToSelect the object that should get selected if the preconditions
     *   to change the selection are met.
     */
    public select(documentToSelect: IdaiFieldDocument) {

        this.router.navigate(['resources', { id: documentToSelect.resource.id }]);
    }

    /**
     * @param document the object that should get opened
     */
    public open(document: IdaiFieldDocument) {

        this.router.navigate(['resources', document.resource.id, 'edit']);
    }

    public queryChanged(query: Query): Promise<any> {

        return new Promise<any>((resolve) => {
            this.query = query;
            this.fetchDocuments(query).then(
                () => {
                    if (this.selectedDocument && this.documents.indexOf(this.selectedDocument) == -1) {
                        this.router.navigate(['resources']);
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

        return this.selectedDocument = documentToSelect;
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

    public createNewDocument(type: string): Promise<any> {

        // var newDocument : IdaiFieldDocument = TODO this does not work for some reason.
        //     { "synced" : 1, "resource" :
        //     { "type" : undefined, "identifier":"hallo","title":undefined}};
        var newDocument = { "resource": { "relations": {}, "type": type } };
        this.selectedDocument = newDocument;

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
        return this.datastore.find(query).then(documents => {
            this.documents = documents as Document[];
            this.notify();
        });
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

        let document=this.selectedDocument;
        if (document==undefined) return Promise.resolve();
        if (!document['_id']) { // TODO work with propely defined interface
            this.remove(document);
            this.selectedDocument=undefined;
            return Promise.resolve();
        }

        return this.datastore.refresh(document).then(
            restoredObject => {
                this.replace(document, <Document>restoredObject);
                this.selectedDocument = restoredObject;
                return Promise.resolve(restoredObject);
            },
            msgWithParams => Promise.reject(msgWithParams)
        );
    }
}
