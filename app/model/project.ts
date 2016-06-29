import {Injectable} from "@angular/core";
import {Document} from "idai-components-2/idai-components-2";
import {IndexeddbDatastore} from "../datastore/indexeddb-datastore";

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
@Injectable()
export class Project {

    public constructor(private datastore: IndexeddbDatastore) {}
    
    public getDocuments() : Document[] {
        return this.documents;
    }

    public setDocuments(objects: Document[]) {
        this.documents = <Document[]> objects;
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
        var newDocument = {"resource":{}};
        this.getDocuments().unshift(<Document>newDocument);
        return newDocument;
    }

    public fetchAllDocuments() {
        this.datastore.all().then(documents => {
            this.setDocuments(documents);
        }).catch(err => console.error(err));
    }

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
     * Restores all objects marked as changed by resetting them to
     * back to the persisted state. In case there are any objects marked
     * as changed which were not yet persisted, they get deleted from the list.
     *
     * @returns {Promise<string[]>} If all objects could get restored,
     *   the promise will just resolve to <code>undefined</code>. If one or more
     *   objects could not get restored properly, the promise will resolve to
     *   <code>string[]</code>, containing ids of M where possible,
     *   and error messages where not.
     */
    public restore(document:Document): Promise<any> {

        return new Promise<any>((resolve, reject) => {
            if (document==undefined) resolve();

            console.log("will try to restore object ",document)

            if (!document['id']) {
                this.remove(document);
                return resolve();
            }

            this.datastore.refresh(document['id']).then(
                restoredObject => {

                    this.replace(document,<Document>restoredObject);
                    resolve();
                },
                err => { reject(this.toStringArray(err)); }
            );
        });
    }


    private toStringArray(str : any) : string[] {
        if ((typeof str)=="string") return [str]; else return str;
    }
}