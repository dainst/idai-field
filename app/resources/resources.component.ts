import {Component, Inject} from "@angular/core";
import {Router} from "@angular/router";
import {IdaiFieldDocument} from "../model/idai-field-document";
import {Query, FilterSet, Datastore} from "idai-components-2/datastore";
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
    protected query: Query = { q: '' };
    protected defaultFilterSet: FilterSet;

    public documents: Document[];
    private ready: Promise<any>;

    constructor(@Inject('app.config') private config,
                private router: Router,
                private datastore: Datastore,
                configLoader: ConfigLoader) {
        var defaultFilterSet = {
            filters: [{field: 'type', value: 'image', invert: true}],
            type: 'and'
        };

        let readyResolveFun: Function;
        this.ready = new Promise<any>(resolve=>{
            readyResolveFun = resolve;
        });

        configLoader.getProjectConfiguration().then(projectConfiguration => {
            if (!this.defaultFilterSet) {
                this.defaultFilterSet = FilterUtility.addChildTypesToFilterSet(defaultFilterSet, projectConfiguration.getTypesMap());
                this.query = {q: '', filterSets: [this.defaultFilterSet]};
                this.fetchDocuments(this.query).then(()=>{
                   readyResolveFun();
                });
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


        return new Promise<any>(resolve=>{
            this.ready.then(()=>{
                this.documents.unshift(<Document> newDocument);
                this.notify();
                resolve(newDocument);

            }).catch(err=>console.error("ResourcesComponent.createNewDocument caught promise err",err));
        });
    }

    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     * @param query
     */
    public fetchDocuments(query: Query) {

        return this.datastore.find(query).then(documents => {
            this.documents = documents as Document[];
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
                resolve(document as Document);
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

        let document=this.selectedDocument;
        if (document==undefined) return Promise.resolve();
        if (!document['id']) {
            this.remove(document);
            this.selectedDocument=undefined;
            return Promise.resolve();
        }

        return this.datastore.refresh(document).then(
            restoredObject => {
                this.replace(document,<Document>restoredObject);
                this.selectedDocument=restoredObject;
                return Promise.resolve(restoredObject);
            },
            err => { return Promise.reject(this.toStringArray(err)); }
        );
    }

    private toStringArray(str : any) : string[] {

        if ((typeof str)=="string") return [str]; else return str;
    }
}
