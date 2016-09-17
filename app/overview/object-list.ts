import {Injectable} from "@angular/core";
import {Document} from "idai-components-2/idai-components-2";
import {IndexeddbDatastore} from "../datastore/indexeddb-datastore";

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
@Injectable()
export class ObjectList {

    private selectedDocument;

    public constructor(private datastore: IndexeddbDatastore) {}
    
    public getDocuments() : Document[] {
        return this.documents;
    }

    public setDocuments(objects: Document[]) {
        this.documents = <Document[]> objects;
    }

    public setSelected(documentToSelect:Document) {
        this.selectedDocument=documentToSelect;
    }

    public getSelected() : Document {
        return this.selectedDocument;
    }
    
    public replace(document:Document,restoredObject: Document) {
        var index = this.documents.indexOf(document);
        this.documents[index] = restoredObject;
    }

    public remove(document: Document) {
        var index = this.getDocuments().indexOf(document);
        this.getDocuments().splice(index, 1);
    }
    
    private documents: Document[];

    public createNewDocument() {
        // var newDocument : IdaiFieldDocument = TODO this does not work for some reason.
        //     { "synced" : 1, "resource" :
        //     { "type" : undefined, "identifier":"hallo","title":undefined}};
        var newDocument = { "resource": { "relations": {} } };
        this.getDocuments().unshift(<Document>newDocument);

        this.selectedDocument=newDocument;

        return newDocument;
    }

    /**
     * Populates the document list with all documents
     * available in the datastore.
     */
    public fetchAllDocuments() {
        this.datastore.all().then(documents => {
            this.setDocuments(documents);
        }).catch(err => console.error(err));
    }

    /**
     * Populates the document list with all documents from
     * the datastore which match the given <code>searchString</code>
     * @param searchString
     */
    public fetchSomeDocuments(searchString) {
        if (searchString == "") {
            this.fetchAllDocuments()
        } else {
            this.datastore.find(searchString).then(documents => {
                this.setDocuments(documents);
            }).catch(err => console.error(err));
        }
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