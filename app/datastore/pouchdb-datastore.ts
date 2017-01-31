import {IdaiFieldDocument} from "../model/idai-field-document";
import {Datastore, Query, FilterSet, Filter} from "idai-components-2/datastore";
import {Document} from "idai-components-2/core";
import {Injectable} from "@angular/core";
import * as PouchDB from "pouchdb";
import {IdGenerator} from "./id-generator";
import {Observable} from "rxjs/Observable";
import {M} from "../m";
import {SearchTermExtractor} from "./search-term-extractor";

import CONFIG = require("config/config.json!json");
import {DOCS} from "./sample-objects";

/**
 * @author Sebastian Cuy
 * @author Daniel M. de Oliveira
 * @author Thomas Kleinke
 */
@Injectable()
export class PouchdbDatastore implements Datastore {

    private static IDAIFIELDOBJECT = 'idai-field-object';

    private db:any;
    private observers = [];
    private documentCache: { [resourceId: string]: Document } = {};
    private readyForQuery: Promise<any>;
    
    constructor() {
        this.db = new PouchDB(PouchdbDatastore.IDAIFIELDOBJECT);
        if (CONFIG['environment'] == 'test') {
            this.readyForQuery = this.clear().then(() => this.loadSampleData());
        } else {
            this.readyForQuery = new Promise(resolve => resolve());
        }
    };

    public create(document:any):Promise<string> {
        return new Promise((resolve, reject) => {

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
                console.debug("created doc successfully",document);
                resolve();
            },err=>{
                console.error("err",err);
                document.id = undefined;
                document['resource']['id'] = undefined;
                document.created = undefined;
                document.modified = undefined;
                reject(M.DATASTORE_IDEXISTS);
            })


        });
    }

    public update(document:IdaiFieldDocument,initial = false):Promise<any> {

        return new Promise((resolve, reject) => {
           if (document.id == null) reject("Aborting update: No ID given. " +
               "Maybe you wanted to create the object with create()?");
           document.modified = new Date();

            if (initial) {
                document['_id'] = document['id'];
            } else {
                // delete document['rev']
            }
            console.debug("preparing update",document)
            this.db.put(document).then(result => {
                this.notifyObserversOfObjectToSync(document);
                document['_rev'] = result['rev'];
                console.debug("updated doc successfully",document);
                resolve();
            },err=>{
                console.error("not updates successfully",err); reject(M.DATASTORE_GENERIC_SAVE_ERROR);
                reject(err)
            })
       });
    }

    public refresh(id:string):Promise<Document>  {
        return this.fetchObject(id);
    }

    public get(id:string):Promise<Document> {
        if (this.documentCache[id]) {
            return new Promise((resolve, reject) => resolve(this.documentCache[id]));
        } else {
            return this.fetchObject(id);
        }
    }

    public remove(id:string):Promise<any> {

        return this.db.remove(id).then(() => delete this.documentCache[id]);
    }

    public clear():Promise<any> {
        return this.db.destroy().then(() => this.db = new PouchDB(PouchdbDatastore.IDAIFIELDOBJECT));
    }

    public documentChangesNotifications(): Observable<Document> {
        return Observable.create( observer => {
            this.observers.push(observer);
        });
    }

    public find(query: Query):Promise<Document[]> {
        return this.readyForQuery.then(() => {
            return this.setupFulltextIndex();
        }).then(() => {
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

    public all():Promise<Document[]> {
        return this.db.allDocs();
    }

    private fetchObject(id:string): Promise<Document> {
        return this.db.get(id);
    }



    private buildResult(result: any[], filterSets: FilterSet[]): Document[] {
        console.debug("buildResult",result);
        var docs = result['rows'].map(row => { return row.doc; });
        return docs.filter( (doc: Document) => {
            return this.docMatchesFilterSets(filterSets, doc);
        });
    }

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

    private notifyObserversOfObjectToSync(document:Document):void {

        this.observers.forEach( observer => {
            observer.next(document)
        } );
    }

    private getCachedInstance(document: any): Document {

        if (!this.documentCache[document['id']]) {
            this.documentCache[document['id']] = document;
        }

        return this.documentCache[document['id']];
    }

    private loadSampleData(): void {
        var promises = [];
        for (var ob of DOCS) promises.push(this.update(ob,true));

        Promise.all(promises)
            .then(() => {
                console.debug("Successfully stored sample objects");
            })
            .catch(err => console.error("Problem when storing sample data", err));
    }
}
