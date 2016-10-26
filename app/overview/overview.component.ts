import {Component, OnInit, Inject} from "@angular/core";
import {Router} from "@angular/router";
import {IdaiFieldDocument} from "../model/idai-field-document";
import {IndexeddbDatastore} from "../datastore/indexeddb-datastore";
import {Document, Query} from "idai-components-2/idai-components-2"
import {Observable} from "rxjs/Observable";

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
export abstract class OverviewComponent {

    protected documents: Document[];
    protected selectedDocument;
    protected observers: Array<any> = [];
    protected query: Query = { q: '' };

    constructor(protected config,
        protected router: Router,
        protected datastore: IndexeddbDatastore
    ) {}

    /**
     * @param documentToSelect the object that should get selected if the preconditions
     *   to change the selection are met.
     */
    public abstract select(documentToSelect: IdaiFieldDocument): void;

    public queryChanged(query: Query) {
        
        this.query = query;
        this.fetchDocuments(query);
    }

    /**
     * @param documentToSelect
     */
    public setSelected(documentToSelect: Document) {

        this.selectedDocument = documentToSelect;
    }

    /**
     * @returns {Document}
     */
    public getSelected(): IdaiFieldDocument {

        return this.selectedDocument;
    }

    public replace(document: Document,restoredObject: Document) {

        var index = this.documents.indexOf(document);
        this.documents[index] = restoredObject;
        this.notify();
    }

    public remove(document: Document) {

        var index = this.documents.indexOf(document);
        this.documents.splice(index, 1);
        this.notify();
    }

    public createNewDocument(type: string) {

        // var newDocument : IdaiFieldDocument = TODO this does not work for some reason.
        //     { "synced" : 1, "resource" :
        //     { "type" : undefined, "identifier":"hallo","title":undefined}};

        var newDocument = { "resource": { "relations": {}, "type": type } };

        this.documents.unshift(<Document> newDocument);
        this.notify();

        this.selectedDocument = newDocument;

        return newDocument;
    }

    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     * @param query
     */
    public fetchDocuments(query: Query) {

        this.datastore.find(query).then(documents => {
            this.documents = documents;
            this.notify();
        }).catch(err => console.error(err));
    }


    /**
     * Gets a document from the datastore and makes
     * it the current selection.
     *
     * @param resourceId
     * @returns {Promise<Document>}
     */
    public loadDoc(resourceId) : Promise<Document> {

        return new Promise<Document>((resolve,reject)=>{

            this.datastore.get(resourceId).then(document=> {
                resolve(document);
                this.setSelected(<Document>document);
            })
        });

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
     * @returns {Promise<Document> | Promise<string[]>} If the document was restored,
     *   it resolves to <code>document</code>, if it was not restored
     *   because it was an unsaved object, it resolves to <code>undefined</code>.
     *   If it could not get restored due to errors, it will resolve to
     *   <code>string[]</code>, containing ids of M where possible,
     *   and error messages where not.
     */
    public restore(): Promise<any> {

        var document=this.selectedDocument;

        return new Promise<any>((resolve, reject) => {
            if (document==undefined) resolve();

            if (!document['id']) {
                this.remove(document);
                this.selectedDocument=undefined;
                return resolve();
            }

            this.datastore.refresh(document['id']).then(
                restoredObject => {

                    this.replace(document,<Document>restoredObject);
                    this.selectedDocument=restoredObject;
                    resolve(restoredObject);
                },
                err => { reject(this.toStringArray(err)); }
            );
        });
    }

    private toStringArray(str : any) : string[] {

        if ((typeof str)=="string") return [str]; else return str;
    }
}
