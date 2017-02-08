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
                .then(() => this.loadSampleData())
                .then(() => this.setupFulltextIndex());
        } else {
            this.readyForQuery = this.setupFulltextIndex()
                .then(() => this.setupIdentifierIndex());
        }
    };

    private setupFulltextIndex(): Promise<any> {

        var ddoc = {
            _id: '_design/fulltext',
            views: {
                fulltext: {
                    map: "function mapFun(doc) {" +
                    "if (doc.resource.shortDescription) emit(doc.resource.shortDescription.toLowerCase(), doc);" +
                    "emit(doc.resource.identifier.toLowerCase(), doc);" +
                    "}" // TODO add more fields to index
                }
            }
        };

        return this.db.put(ddoc).then(
            () => console.debug('successfully set up fulltext index'),
            err => {
                if (err.name !== 'conflict') {
                    throw err;
                }
            }
        );
    }

    private setupIdentifierIndex(): Promise<any> {

        var ddoc = {
            _id: '_design/identifier',
            views: {
                fulltext: {
                    map: "function mapFun(doc) {" +
                    "emit(doc.resource.identifier);" +
                    "}" // TODO add more fields to index
                }
            }
        };

        return this.db.put(ddoc).then(
            () => console.debug('successfully set up identifier index'),
            err => {
                if (err.name !== 'conflict') {
                    throw err;
                }
            }
        );
    }

    private identifierExists(identifier: string) : Promise<boolean> {
        return new Promise<boolean> ((resolve,reject)=> {
            this.db.query('fulltext', {
                startkey: identifier,
                endkey: identifier + '\uffff',
                include_docs: true
            }).then((result)=>{
                resolve(result['rows'].length > 0);
            },err=>reject(err));
        });
    }

    public create(document: any): Promise<string> {
        return new Promise((resolve, reject) => {
            this.readyForQuery
                .then(()=>this.identifierExists(document.resource.identifier))
                .then((exists)=>{

                    if (exists) {

                        reject(M.DATASTORE_IDEXISTS);

                    } else {

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
                    }

            }).catch(err=>{
                console.log("error in create",err);
                reject(err);
            });
        });
    }

    public update(document:IdaiFieldDocument, initial = false): Promise<any> {

        return new Promise((resolve, reject) => {
           if (document.id == null) reject("Aborting update: No ID given. " +
               "Maybe you wanted to create the object with create()?");
           document.modified = new Date();

            if (initial) {
                document['_id'] = document['id'];
            } else {
                // delete document['rev']
            }
            console.debug("preparing update", document);
            this.db.put(document).then(result => {
                this.notifyObserversOfObjectToSync(document);
                document['_rev'] = result['rev'];
                this.documentCache[document['id']] = document;
                console.debug("updated doc successfully", document);
                resolve();
            }, err => {
                console.error("not updates successfully", err); reject(M.DATASTORE_GENERIC_SAVE_ERROR);
                reject(err)
            })
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

    public clear(): Promise<any> {
        return this.db.destroy().then(() => this.db = new PouchDB(PouchdbDatastore.IDAIFIELDOBJECT));
    }

    public documentChangesNotifications(): Observable<Document> {

        return Observable.create( observer => {
            this.observers.push(observer);
        });
    }

    public find(query: Query):Promise<Document[]> {

        return this.readyForQuery.then(() => {
            var queryString = query.q.toLowerCase();
            return this.db.query('fulltext', {
                startkey: queryString,
                endkey: queryString + '\uffff',
                include_docs: true
            });
        }).then(result => {
            return this.buildResult(result, query.filterSets);
        });
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

    private loadSampleData(): void {

        var promises = [];
        for (var ob of DOCS) promises.push(this.update(ob, true));

        Promise.all(promises)
            .then(() => {
                console.debug("Successfully stored sample objects");
            })
            .catch(err => console.error("Problem when storing sample data", err));
    }
}
