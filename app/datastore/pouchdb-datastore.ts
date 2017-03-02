import {Query} from "idai-components-2/datastore";
import {Document} from "idai-components-2/core";
import {Injectable} from "@angular/core";
import * as PouchDB from "pouchdb";
import {IdGenerator} from "./id-generator";
import {Observable} from "rxjs/Observable";
import {M} from "../m";
import {IdaiFieldDatastore} from "./idai-field-datastore";

import {DOCS} from "./sample-objects";

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
@Injectable()
export class PouchdbDatastore implements IdaiFieldDatastore {

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
                                "emit(['', token.toLowerCase()]);" +
                                "emit([doc.resource.type, token.toLowerCase()]);" +
                            "});" +
                        "if (doc.resource.identifier) {" +
                            "emit(['', doc.resource.identifier.toLowerCase()]);" +
                            "emit([doc.resource.type, doc.resource.identifier.toLowerCase()]);" +
                        "}" +
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
     * @param document
     * @returns {Promise<Document|string>} same instance of the document or error message
     */
    public create(document: any): Promise<Document|string> {

        return this.readyForQuery
            .then(()=> {
                if (document.id != undefined) return Promise.reject("Aborting creation: Object already has an ID. " +
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
     */
    public find(query: Query,
                offset:number=0,
                limit:number=-1):Promise<Document[]> {

        if (!query) return Promise.resolve([]);

        let q = query.q ? query.q : '';
        let sets = query.types ? query.types : [''];

        let promises = sets
            .map(set => this.queryForSet(q, set, query.prefix, offset, limit));

        return Promise.all(promises)
            .then(results => {
                let result = results.reduce((acc, val) => {
                    return acc.concat(val);
                }, []);
                return this.filterResult(result);
            });
    }

    private queryForSet(query:string, set:string, prefix:boolean, offset:number,
                        limit:number):Promise<Document[]> {

        let opt = {
            reduce: false,
            include_docs: true,
        };
        let q = query.toLowerCase();
        opt['startkey'] = [set, q];
        let endKey = prefix ? q + '\uffff' : q;
        opt['endkey'] = [set, endKey];
        // performs poorly according to PouchDB documentation
        // could be replaced by using startKey instead
        // (see http://docs.couchdb.org/en/latest/couchapp/views/pagination.html)
        if (offset) opt['skip'] = offset;
        if (limit > -1) opt['limit'] = limit;

        return this.readyForQuery
            .then(() => this.db.query('fulltext', opt))
            .then(result => this.docsFromResult(result));
    }

    public findByIdentifier(identifier: string): Promise<Document> {

        return this.readyForQuery.then(() => {
           return this.db.query('identifier', {
               key: identifier,
               include_docs: true
           }).then(result => {
               if (result.rows.length > 0) return result.rows[0].doc;
           });
        });
    }

    /**
     * Implements {@link ReadDatastore#all}.
     */
    public all(sets?:string[],
               offset:number=0,
               limit:number=-1): Promise<Document[]|string> {

        let opt = {
            include_docs: true
        };
        // performs poorly according to PouchDB documentation
        // could be replaced by using startKey instead
        // (see http://docs.couchdb.org/en/latest/couchapp/views/pagination.html)
        if (offset) opt['skip'] = offset;
        if (limit > -1) opt['limit'] = limit;

        return this.readyForQuery
            .then(() => this.db.allDocs(opt))
            .then(result => this.docsFromResult(result));
    }

    private fetchObject(id: string): Promise<Document> {
        return this.db.get(id);
    }

    private docsFromResult(result: any[]): Document[] {
        return result['rows'].map(row => row.doc);
    }

    // only return every doc once by using Set
    private filterResult(docs: Document[]): Document[] {
        let set: Set<string> = new Set<string>();
        let filtered = [];
        docs.forEach(doc => {
            if (!set.has(doc.resource.id)) {
                set.add(doc.resource.id);
                filtered.push(doc);
            }
        });
        return filtered;
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
