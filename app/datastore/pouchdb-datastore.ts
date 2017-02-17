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
    private documentCache: { [resourceId: string]: Document } = {};
    private readyForQuery: Promise<any>;

    private static reduceFun: string = "function reduceFun(keys, values) {" +
        "var result = [];" +
        "values.forEach(function(value) {" +
        "if (result.indexOf(value) == -1) result.push(value);" +
        "});" +
        "return result" +
        "}";

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
                                "emit(token.toLowerCase(), doc._id);" +
                            "});" +
                        "if (doc.resource.identifier) emit(doc.resource.identifier.toLowerCase(), doc._id)" +
                    "}",
                    reduce: PouchdbDatastore.reduceFun
                }
            });
    }

    private setupIdentifierIndex(): Promise<any> {
        return this.setupIndex('_design/identifier',{ identifier: { map: "function mapFun(doc) {"+
            "emit(doc.resource.identifier,doc._id);" +
            "}",reduce:PouchdbDatastore.reduceFun }})
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
     * @returns {Promise<Document|string>}
     */
    public create(document: any): Promise<Document|string> {

        return this.readyForQuery
            .then(()=> {
                if (document.id != null) return Promise.reject("Aborting creation: Object already has an ID. " +
                    "Maybe you wanted to update the object with update()?");
                document.id = IdGenerator.generateId();
                document['resource']['id'] = document.id;
                document.created = new Date();
                document.modified = document.created;
                document['_id'] = document['id'];
                this.documentCache[document['id']] = document;

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
     * @returns {Promise<Document|string>}
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
                this.documentCache[document['id']] = document;
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

        if (this.documentCache[id]) {
            return new Promise((resolve, reject) => resolve(this.documentCache[id]));
        } else {
            return this.fetchObject(id);
        }
    }

    /**
     * Implements {@link Datastore#remove}.
     *
     * @param doc
     * @returns {Promise<undefined|string>}
     */
    public remove(doc: Document): Promise<undefined|string> {
        return this.db.remove(doc).then(() => delete this.documentCache[doc.resource.id]);
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
     * The find method guarantees to return a cached instance if there is any.
     *
     * TODO implement option to match exactly
     *
     * @param query
     * @param fieldName
     * @returns {Promise<Document[]|string>}
     */
    public find(query: Query,fieldName:string='fulltext'):Promise<Document[]> {

        if (['fulltext','identifier'].indexOf(fieldName) == -1) return Promise.resolve([]);
        if (query == undefined) query = {q:''};

        return this.readyForQuery.then(() => {
            let queryString = query.q.toLowerCase();
            return this.db.query(fieldName, {
                startkey: queryString,
                endkey: queryString + '\uffff',
                reduce: true
            });
        }).then(result => this.buildResult(result, query.filterSets))
        .then(result => this.replaceWithCached(result));
    }

    private replaceWithCached(results) {
        for (let result of results) {
            if (this.documentCache[result.resource.id]) {
                result = this.documentCache[result.resource.id];
            }
        }
        return results;
    }

    /**
     * Implements {@link ReadDatastore#all}.
     *
     * @returns {Promise<Document[]|string>}
     */
    public all(): Promise<Document[]|string> {
        return this.db.allDocs();
    }

    private fetchObject(id: string): Promise<Document> {
        return this.db.get(id);
    }

    private buildResult(result: any[], filterSets: FilterSet[]): Promise<Document[]> {

        if (result['rows'] == undefined || result['rows'][0] == undefined) return Promise.resolve([]);

        let docIds = result['rows'][0].value;
        return Promise.all(docIds.map(docId => this.get(docId))).then(docs => {
            return docs.filter( (doc: Document) => this.docMatchesFilterSets(filterSets, doc));
        });
    }



    private docMatchesFilterSets(filterSets: FilterSet[], doc: Document): boolean {

        if (!filterSets) return true;

        for (let filterSet of filterSets) {
            if (!filterSet) continue;
            if (filterSet.type == "and" && !this.docMatchesAndFilters(filterSet.filters, doc)) return false;
            if (filterSet.type == "or" && !this.docMatchesOrFilters(filterSet.filters, doc)) return false;
        }

        return true;
    }

    private docMatchesAndFilters(filters: Filter[], doc: Document): boolean {

        if (!filters) return true;

        for (let filter of filters) {
            if (!filter) continue;
            if (filter.invert) {
                if ((filter.field in doc.resource) && doc.resource[filter.field] == filter.value) return false;
            } else {
                if (!(filter.field in doc.resource) || doc.resource[filter.field] != filter.value) return false;
            }
        }

        return true;
    }

    private docMatchesOrFilters(filters: Filter[], doc: Document): boolean {

        if (!filters || filters.length == 0) return true;

        for (let filter of filters) {
            if (filter.invert) {
                if (!(filter.field in doc.resource) || doc.resource[filter.field] != filter.value) return true;
            } else {
                if ((filter.field in doc.resource) && doc.resource[filter.field] == filter.value) return true;
            }
        }

        return false;
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
                    console.debug("Successfully stored sample objects");
                    resolve();
                })
                .catch(err => {console.error("Problem when storing sample data", err);reject();});
        });
    }
}
