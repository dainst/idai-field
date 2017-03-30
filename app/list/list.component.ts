import {Component} from "@angular/core";
import {IdaiFieldDocument} from "../model/idai-field-document";
import {Query, Datastore} from "idai-components-2/datastore";

@Component({
    moduleId: module.id,
    templateUrl: './list.html'
})

export class ListComponent {

    public documents: IdaiFieldDocument[];
    public selectedDocument: IdaiFieldDocument;

    protected query: Query = {q: '', type: 'resource', prefix: true};

    constructor(
        private datastore: Datastore
    ) {
        this.fetchDocuments();
    }

    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     * @param query
     */
    public fetchDocuments(query: Query = this.query): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            return this.datastore.find(query).then(documents => {
                this.documents = documents as IdaiFieldDocument[];
                resolve();
            }).catch(err => { console.error(err); reject(); } );
        });
    } 


    public select(documentToSelect: IdaiFieldDocument) {
       this.selectedDocument = documentToSelect;
    }   
}