import {Datastore, Query, FilterSet, Filter} from "idai-components-2/datastore";
import {Document} from "idai-components-2/core";
import {Injectable} from "@angular/core";
import * as PouchDB from "pouchdb";
import {IdGenerator} from "./id-generator";
import {Observable} from "rxjs/Observable";
import {M} from "../m";

import {DOCS} from "./sample-objects";

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
@Injectable()
export class PouchdbDatastore implements Datastore {

    private db: any;
    private observers = [];
    private readyForQuery: Promise<any>;

    constructor(private dbname,loadSampleData: boolean = false) {
        this.db = new PouchDB(dbname);

        if (loadSampleData) {
            this.readyForQuery = this.clear()
                .then(() => this.setupFulltextIndex())
                .then(() => this.setupIdentifierIndex()).then(()=>this.loadSampleData());
        } else {
            this.readyForQuery = this.setupFulltextIndex()
                .then(() => this.setupIdentifierIndex())
        }
    }

    private setupFulltextIndex(): Promise<any> {
        return this.setupIndex('_design/fulltext', {
                fulltext: {
                    map: "function mapFun(doc) {" +
                        "if (doc.resource.shortDescription) " +
                            "doc.resource.shortDescription.split(/[\\.;,\\- ]+/).forEach(function(token) { "+
                                "emit(token.toLowerCase());" +
                            "});" +
                        "if (doc.resource.identifier) emit(doc.resource.identifier.toLowerCase())" +
                    "}"
                }
            });
    }

    private setupIdentifierIndex(): Promise<any> {
        return this.setupIndex('_design/identifier',{ identifier: { map: "function mapFun(doc) {"+
            "emit(doc.resource.identifier);" +
            "}" }})
    }

    private setupIndex(id,views) {
        let ddoc = {
            _id: id,
            views: views
        };

        return this.db.put(ddoc).then(
            () => {},
            err => {
                if (err.name !== 'conflict') {
                    throw err;
                }
            }
        );
    }

    /**
     * Implements {@link Datastore#create}.
     *
     * The created instance is put to the cache.
     *
     * @param document
     * @returns {Promise<Document|string>} same instance of the document or error message
     */
    public create(document: any): Promise<Document|string> {

        return this.readyForQuery
            .then(()=> {
                if (document.id != null) return Promise.reject("Aborting creation: Object already has an ID. " +
                    "Maybe you wanted to update the object with update()?");
                document.id = IdGenerator.generateId();
                if (!document['resource']['id']) {
                    document['resource']['id'] = document.id;
                }
                document.created = new Date();
                document.modified = document.created;
                document['_id'] = document['id'];

                return this.db.put(document);
            })
            .then(result => {
                this.notifyObserversOfObjectToSync(document);
                document['_rev'] = result['rev'];
                return Promise.resolve(document);

            }).catch(err => {
                document.id = undefined;
                document['resource']['id'] = undefined;
                document.created = undefined;
                document.modified = undefined;
                if (err == undefined) return Promise.reject(M.DATASTORE_GENERIC_SAVE_ERROR);
                return Promise.reject(err);
            })
    }

    private updateReadyForQuery(skipCheck) : Promise<any>{
        if (!skipCheck) {
            return this.readyForQuery;
        }
        else {
            return new Promise<any>((resolve)=>{resolve();})
        }
    }

    /**
     * Implements {@link Datastore#update}.
     *
     * The updated instance gets put to the cache.
     *
     * @param document
     * @param initial
     * @returns {Promise<Document|string>} same instance of the document or error message
     */
    public update(document:Document, initial = false): Promise<Document|string> {

        return this.updateReadyForQuery(initial)
            .then(()=> {
                if (document['id'] == null) return Promise.reject("Aborting update: No ID given. " +
                    "Maybe you wanted to create the object with create()?");
                document.modified = new Date();

                if (initial) {
                    document['_id'] = document['id'];
                } else {
                    // delete document['rev']
                }
                return this.db.put(document)

            }).then(result => {

                this.notifyObserversOfObjectToSync(document);
                document['_rev'] = result['rev'];
                return Promise.resolve(document);

            }).catch(err => {
                if (err == undefined) return Promise.reject(M.DATASTORE_GENERIC_SAVE_ERROR);

                return Promise.reject(err)
            })
    }

    /**
     * Implements {@link ReadDatastore#refresh}.
     *
     * @param doc
     * @returns {Promise<Document|string>}
     */
    public refresh(doc: Document): Promise<Document|string> {

        return this.fetchObject(doc.resource.id);
    }

    /**
     * Implements {@link ReadDatastore#get}.
     *
     * @param id
     * @returns {any}
     */
    public get(id: string): Promise<Document|string> {
        return this.fetchObject(id);
    }

    /**
     * Implements {@link Datastore#remove}.
     *
     * @param doc
     * @returns {Promise<undefined|string>}
     */
    public remove(doc: Document): Promise<undefined|string> {
        return this.db.remove(doc);
    }

    private clear(): Promise<any> {
        return this.db.destroy().then(() => this.db = new PouchDB(this.dbname)); // TODO indices are not recreated
    }

    public shutDown(): Promise<any> {
        return this.db.destroy();
    }

    public documentChangesNotifications(): Observable<Document> {

        return Observable.create( observer => {
            this.observers.push(observer);
        });
    }

    /**
     * Implements {@link ReadDatastore#find}.
     *
     * @param query
     * @param set TODO rename fieldName to set in interface
     * @returns {Promise<Document[]|string>}
     */
    public find(query: Query, set:string = undefined):Promise<Document[]> {

        if (query == undefined) query = {q:''};

        return this.readyForQuery.then(() => {
            let queryString = query.q.toLowerCase();
            if (queryString) return this.db.query('fulltext', {
                startkey: queryString,
                endkey: queryString + '\uffff',
                reduce: false,
                include_docs: true
            });
            else return this.all();
        }).then(result => { return this.buildResult(result, query.filterSets)} );
    }

    /**
     * Implements {@link ReadDatastore#all}.
     * TODO add param set
     * @returns {Promise<Document[]|string>}
     */
    public all(): Promise<Document[]|string> {
        return this.db.allDocs({
            include_docs: true
        });
    }

    private fetchObject(id: string): Promise<Document> {
        return this.db.get(id);
    }

    private buildResult(result: any[], filterSets: FilterSet[]): Document[] {

        // only return every doc once by using Set
        let docs: Set<Document> = new Set<Document>();
        result['rows'].forEach(row => {
            if(this.docMatchesFilterSets(filterSets, row.doc)) docs.add(row.doc);
        });
        return Array.from(docs);
    }



    private docMatchesFilterSets(filterSets: FilterSet[], doc: Document): boolean {

        if (!doc.resource) return false;
        if (!filterSets) return true;

        for (let filterSet of filterSets) {
            if (!filterSet) continue;
            if (!this.docMatchesFilters(filterSet.filters, doc)) return false;
        }

        return true;
    }

    private docMatchesFilters(filters: Filter[], doc: Document): boolean {
        if (!filters) return true;
        let match = false;
        for (let filter of filters) {
            if (!filter) continue;
            if (doc.resource.type == filter.value) {

                match = true;
            }
        }
        return match;
    }

    private notifyObserversOfObjectToSync(document:Document): void {
        this.observers.forEach( observer => {
            observer.next(document);
        } );
    }

    private loadSampleData(): Promise<any> {

        return new Promise<any>((resolve,reject)=>{

            let promises = [];
            for (let ob of DOCS) promises.push(this.update(ob, true));

            Promise.all(promises)
                .then(() => {
                    console.debug("Successfully stored sample documents");
                    resolve();
                })
                .catch(err => {console.error("Problem when storing sample data", err);reject();});
        });
    }
}
