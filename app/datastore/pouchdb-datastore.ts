import {IdaiFieldDocument} from "../model/idai-field-document";
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

    private static IDAIFIELDOBJECT = 'idai-field-object';

    private db: any;
    private observers = [];
    private documentCache: { [resourceId: string]: Document } = {};
    private readyForQuery: Promise<any>;
    
    constructor(loadSampleData: boolean = false) {
        this.db = new PouchDB(PouchdbDatastore.IDAIFIELDOBJECT);

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
                    "if (doc.resource.shortDescription) emit(doc.resource.shortDescription.toLowerCase(), doc);" +
                    "emit(doc.resource.identifier.toLowerCase(), doc);" +
                    "}" // TODO add more fields to index
                }
            });
    }

    private setupIdentifierIndex(): Promise<any> {
        return this.setupIndex('_design/identifier',{ identifier: { map: "function mapFun(doc) {"+
            "emit(doc.resource.identifier);" +
            "}"}})
    }

    private setupIndex(id,views) {
        var ddoc = {
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
     * @returns {Promise<boolean>} true if there is at least one other document
     *   having the same resource identifier as <code>document</code>.
     */
    private identifierExists(document: any) : Promise<boolean> {
        return new Promise<boolean> ((resolve,reject)=> {

            this.db.query('identifier', {
                startkey: document.resource.identifier,
                endkey: document.resource.identifier + '\uffff',
                include_docs: true
            }).then((result)=>{
                var hits = 0;
                for (let hit of result['rows']) {
                    if (!document['id'] || (hit['id']!=document['id'])){
                        hits++;
                    }
                }
                resolve(hits > 0);


            },err=>reject(err));
        });
    }

    /**
     * The created instance is put to the cache.
     *
     * @param document
     * @returns {Promise<T>}
     */
    public create(document: any): Promise<string> {

        return new Promise((resolve, reject) => {
            this.readyForQuery
                .then(()=>this.identifierExists(document))
                .then((exists)=>{

                    if (exists) return reject(M.DATASTORE_IDEXISTS);

                    if (document.id != null) reject("Aborting creation: Object already has an ID. " +
                        "Maybe you wanted to update the object with update()?");
                    document.id = IdGenerator.generateId();
                    document['resource']['id'] = document.id;
                    document.created = new Date();
                    document.modified = document.created;
                    document['_id'] = document['id'];
                    this.documentCache[document['id']] = document;

                    this.db.put(document).then(result => {
                        this.notifyObserversOfObjectToSync(document);
                        document['_rev'] = result['rev'];
                        resolve();
                    },err => {
                        document.id = undefined;
                        document['resource']['id'] = undefined;
                        document.created = undefined;
                        document.modified = undefined;
                        reject(err);
                    })

            }).catch(err=>{
                reject(err);
            });
        });
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
     * The updated instance gets put to the cache.
     *
     * @param document
     * @param initial
     * @returns {Promise<T>}
     */
    public update(document:IdaiFieldDocument, initial = false): Promise<any> {

        return new Promise((resolve, reject) => {
            this.updateReadyForQuery(initial)
                .then(()=>this.identifierExists(document))
                .then((exists)=> {
                    if (exists) return reject(M.DATASTORE_IDEXISTS);

                    if (document.id == null) reject("Aborting update: No ID given. " +
                        "Maybe you wanted to create the object with create()?");
                    document.modified = new Date();

                    if (initial) {
                        document['_id'] = document['id'];
                    } else {
                        // delete document['rev']
                    }
                    this.db.put(document).then(result => {
                        this.notifyObserversOfObjectToSync(document);
                        document['_rev'] = result['rev'];
                        this.documentCache[document['id']] = document;
                        resolve();
                    }, err => {
                        reject(M.DATASTORE_GENERIC_SAVE_ERROR);
                        reject(err)
                    })


                }).catch(err=>{console.log("error",err)});
       });
    }

    public refresh(id: string): Promise<Document> {
        return this.fetchObject(id);
    }

    public get(id: string): Promise<Document> {

        if (this.documentCache[id]) {
            return new Promise((resolve, reject) => resolve(this.documentCache[id]));
        } else {
            return this.fetchObject(id);
        }
    }

    public remove(id: string): Promise<any> {

        return this.get(id).then((doc) => {
            return this.db.remove(doc).then(() => delete this.documentCache[id]);
        })
    }

    private clear(): Promise<any> {
        return this.db.destroy().then(() => this.db = new PouchDB(PouchdbDatastore.IDAIFIELDOBJECT));
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
     * The find method guarantees to return a cached instance if there is any.
     *
     * @param query
     * @returns {Promise<TResult>}
     */
    public find(query: Query):Promise<Document[]> {

        return this.readyForQuery.then(() => {
            var queryString = query.q.toLowerCase();
            return this.db.query('fulltext', {
                startkey: queryString,
                endkey: queryString + '\uffff',
                include_docs: true
            });
        }).then(result => {
            return this.replaceWithCached(
                this.distinctDocuments( // for some reason we get duplicates from buildResult
                    this.buildResult(result, query.filterSets)))
        });
    }

    private distinctDocuments(documents) {
        var keep = [];
        var del = [];
        for (var i in documents) {
            if (keep.indexOf(documents[i].resource.id) == -1) {
                keep.push(documents[i].resource.id);
            } else {
                del.push(i)
            }
        }

        for (var j=documents.length;j>0;j--) {
            if (del.indexOf(j.toString())!=-1) {
                documents.splice(j,1);
            }
        }
        return documents;
    }

    private replaceWithCached(results_) {
        for (let i in results_) {
            if (this.documentCache[results_[i].resource.id]) {
                results_[i] = this.documentCache[results_[i].resource.id];
            }
        }
        return results_;
    }


    public all(): Promise<Document[]> {
        return this.db.allDocs();
    }

    private fetchObject(id: string): Promise<Document> {
        return this.db.get(id);
    }

    private buildResult(result: any[], filterSets: FilterSet[]): Document[] {

        var docs = result['rows'].map(row => { return row.doc; });
        return docs.filter( (doc: Document) => {
            return this.docMatchesFilterSets(filterSets, doc);
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

            var promises = [];
            for (var ob of DOCS) promises.push(this.update(ob, true));

            Promise.all(promises)
                .then(() => {
                    console.debug("Successfully stored sample objects");
                    resolve();
                })
                .catch(err => {console.error("Problem when storing sample data", err);reject();});
        });
    }
}
