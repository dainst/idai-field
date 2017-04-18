import {Query} from "idai-components-2/datastore";
import {Document} from "idai-components-2/core";
import {ConfigLoader, ProjectConfiguration} from "idai-components-2/configuration";
import {Injectable} from "@angular/core";
import * as PouchDB from "pouchdb";
import {IdGenerator} from "./id-generator";
import {Observable} from "rxjs/Observable";
import {M} from "../m";
import {IdaiFieldDatastore} from "./idai-field-datastore";
import {ReadDatastore,Datastore} from 'idai-components-2/datastore';

import {DOCS} from "./sample-objects";
import {SyncState} from "./sync-state";
import {DatastoreErrors} from "idai-components-2/datastore";
import {IdaiFieldDocument} from "../model/idai-field-document";

// suppress compile errors for PouchDB view functions
declare function emit(key:any, value?:any):void;

@Injectable()
/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class PouchdbDatastore implements IdaiFieldDatastore {

    protected db: any;
    private observers = [];
    private readyForQuery: Promise<any>;
    private config: ProjectConfiguration;
    private syncHandles = [];

    constructor(private dbname: string,
                configLoader: ConfigLoader,
                loadSampleData: boolean = false) {

        this.dbname = dbname;
        this.readyForQuery = this.setupDatabase(dbname)
            .then(db => {
                console.debug("PouchDB uses adapter: " + db.adapter);
                this.db = db;
            });
        if (loadSampleData)
            this.readyForQuery = this.readyForQuery.then(() => this.clear());
        this.readyForQuery = this.readyForQuery
            .then(() => this.setupFulltextIndex())
            .then(() => this.setupIdentifierIndex())
            .then(() => this.setupSyncedIndex())
            .then(() => this.setupTypesIndex())
            .then(() => this.setupAllIndex())
            .then(() => configLoader.getProjectConfiguration())
            .then(config => this.config = config);
        if (loadSampleData)
            this.readyForQuery = this.readyForQuery.then(() => this.loadSampleData());
        this.readyForQuery = this.readyForQuery.then(() => this.setupChangesEmitter());

    }

    protected setupDatabase(dbname:string): Promise<any> {
        return Promise.resolve(new PouchDB(dbname));
    }

    private setupFulltextIndex(): Promise<any> {
        this.db.on('error', err => console.error(err.toString()));
        let mapFun = function(doc) {
            const types = ['', doc.resource.type].concat(doc.resource['_parentTypes']);
            if (types.indexOf('image') == -1) types.push('resource');
            types.forEach(function(type) {
                if (doc.resource.shortDescription)
                    doc.resource.shortDescription.split(/[.;,\- ]+/)
                        .forEach(token => emit([type, token.toLowerCase()]));
                if (doc.resource.identifier)
                    emit([type, doc.resource.identifier.toLowerCase()]);
            });
        };
        return this.setupIndex('fulltext', mapFun);
    }

    private setupSyncedIndex(): Promise<any> {
        let mapFun = function(doc) {
            emit(doc.synced);
        };
        return this.setupIndex('synced', mapFun);
    }

    private setupIdentifierIndex(): Promise<any> {
        let mapFun = function(doc) {
            emit(doc.resource.identifier);
        };
        return this.setupIndex('identifier', mapFun);
    }

    private setupAllIndex(): Promise<any> {
        let mapFun = function(doc) {
            const types = ['', doc.resource.type].concat(doc.resource['_parentTypes']);
            if (types.indexOf('image') == -1) types.push('resource');
            types.forEach(type => emit([type, doc.modified]));
        };
        return this.setupIndex('all', mapFun);
    }

    private setupTypesIndex(): Promise<any> {
        let mapFun = function(doc) {
            emit(doc.resource.type);
        };
        return this.setupIndex('types', mapFun);
    }


    private setupIndex(id, mapFun) {

        let ddoc = {
            _id: '_design/' + id,
            views: { }
        };
        ddoc.views[id] = { map: mapFun.toString() };

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
     * @param initial
     * @returns {Promise<Document>} same instance of the document
     */
    public create(document: Document, initial: boolean = false): Promise<Document> {

        let reset = this.resetDocOnErr(document);

        return this.updateReadyForQuery(initial)
            .then(() => this.proveThatDoesNotExist(document))
            .then(() => {

                if (!document.resource.id) {
                    document.resource.id = IdGenerator.generateId();
                }
                document['_id'] = document.resource.id;
                document.resource['_parentTypes'] = this.config
                    .getParentTypes(document.resource.type);

                document.created = new Date();
                document.modified = document.created;

                return this.db.put(document).catch(
                    err => {
                        console.error(err);
                        return Promise.reject(DatastoreErrors.GENERIC_SAVE_ERROR);
                    }
                );
            })
            .then(result => {

                document['_rev'] = result['rev'];
                return Promise.resolve(this.cleanDoc(document));

            }).catch(keyOfM => {

                reset(document);
                return Promise.reject([keyOfM]);
            })
    }

    /**
     * @param doc
     * @return resolve when document with the given resource id does not exist already, reject otherwise
     */
    private proveThatDoesNotExist(doc:Document): Promise<any> {
        if (doc.resource.id) {
            return this.fetchObject(doc.resource.id)
                .then(result => Promise.reject(M.DATASTORE_RESOURCE_ID_EXISTS), () => Promise.resolve())
        } else return Promise.resolve();
    }

    private static MSG_ID_EXISTS_IN_CREATE: string = 'Aborting creation: document.id already exists. ' +
        'Maybe you wanted to update the object with update()?';

    private updateReadyForQuery(skipCheck): Promise<any>{
        if (!skipCheck) {
            return this.readyForQuery;
        }
        else {
            return new Promise<any>((resolve) => {resolve();})
        }
    }

    /**
     * Implements {@link Datastore#update}.
     * @param document
     * @returns {Promise<Document>} same instance of the document
     */
    public update(document: Document): Promise<Document> {

        let reset = this.resetDocOnErr(document);

        return this.readyForQuery
            .then(()=> {
                if (document.resource.id == null) {
                    console.error("Aborting update: No _id given. " +
                        "Maybe you wanted to create the object with create()?");
                    return Promise.reject(undefined);
                }
                document['_id'] = document.resource.id;
                document.modified = new Date();
                document.resource['_parentTypes'] = this.config
                    .getParentTypes(document.resource.type);

                return this.db.put(document);

            }).then(result => {

                document['_rev'] = result['rev'];
                return Promise.resolve(this.cleanDoc(document));

            }).catch(err => {

                let errType = DatastoreErrors.GENERIC_SAVE_ERROR;
                if (err.name && err.name == 'conflict')
                    errType = DatastoreErrors.SAVE_CONFLICT;
                reset(document);
                return Promise.reject([errType]);
            })
    }

    private resetDocOnErr(original: Document) {
        let created = original.created;
        let modified = original.modified;
        let id = original.resource.id;
        return function(document: Document) {
            delete document['_id'];
            delete document.resource['_parentTypes'];
            document.resource.id = id;
            document.created = created;
            document.modified = modified;
        }
    }

    /**
     * Implements {@link ReadDatastore#refresh}.
     *
     * @param doc
     * @returns {Promise<Document>}
     */
    public refresh(doc: Document): Promise<Document> {
        return this.fetchObject(doc.resource.id)
            .then(doc => this.cleanDoc(doc));
    }

    /**
     * Implements {@link ReadDatastore#get}.
     *
     * @param resourceId
     * @returns {any}
     */
    public get(resourceId: string): Promise<Document> {
        return this.readyForQuery
            .then(() => this.fetchObject(resourceId))
            .then(doc => this.cleanDoc(doc));
    }

    /**
     * Implements {@link Datastore#remove}.
     *
     * @param doc
     * @returns {Promise<undefined>}
     */
    public remove(doc: Document): Promise<undefined> {
        return this.db.remove(doc)
            .catch(err => Promise.reject([M.DATASTORE_GENERIC_ERROR]));
    }

    private clear(): Promise<any> {
        return this.db.destroy()
            .then(() => this.db = new PouchDB(this.dbname)); // TODO indices are not recreated
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
                offset: number=0,
                limit: number=-1): Promise<Document[]> {

        if (!query) return Promise.resolve([]);

        let q = query.q ? query.q.toLowerCase() : '';
        let type = query.type ? query.type : '';

        let opt = {
            reduce: false,
            include_docs: true,
            conflicts: true,
        };
        opt['startkey'] = [type, q];
        let endKey = query.prefix ? q + '\uffff' : q;
        opt['endkey'] = [type, endKey];
        // performs poorly according to PouchDB documentation
        // could be replaced by using startKey instead
        // (see http://docs.couchdb.org/en/latest/couchapp/views/pagination.html)
        if (offset) opt['skip'] = offset;
        if (limit > -1) opt['limit'] = limit;

        return this.readyForQuery
            .then(() => this.db.query('fulltext', opt))
            .then(result => this.filterResult(this.docsFromResult(result)));
    }

    public findUnsynced(): Promise<Document[]> {

        return this.readyForQuery.then(() => {
            return this.db.query('synced', {
                key: 0,
                include_docs: true,
                conflicts: true,
            }).then(result => {
                return Promise.resolve(result.rows.map(result=>this.cleanDoc(result.doc)));
            });
        });
    }

    public findByType(type: string): Promise<IdaiFieldDocument []> {
        return this.readyForQuery.then(() => {
            return this.db.query('types', {
                key: type,
                include_docs: true,
                conflicts: true,
            }).then(result => {
                return Promise.resolve(result.rows.map(result=>this.cleanDoc(result.doc)));
            });
        });
    }

    public findByIdentifier(identifier: string): Promise<Document> {

        return this.readyForQuery.then(() => {

            if (identifier == undefined) return Promise.reject([M.DATASTORE_NOT_FOUND]);

            return this.db.query('identifier', {
                key: identifier,
                include_docs: true,
                conflicts: true,
            }).then(result => {
               if (result.rows.length > 0) {
                   return Promise.resolve(this.cleanDoc(result.rows[0].doc));
               } else {
                   return Promise.reject([M.DATASTORE_NOT_FOUND]);
               }
            });
        });
    }

    /**
     * Implements {@link ReadDatastore#all}.
     */
    public all(type:string='',
               offset:number=0,
               limit:number=-1): Promise<Document[]> {

        let opt = {
            include_docs: true,
            startkey: [type, {}],
            endkey: [type],
            descending: true,
            conflicts: true,
        };
        // performs poorly according to PouchDB documentation
        // could be replaced by using startKey instead
        // (see http://docs.couchdb.org/en/latest/couchapp/views/pagination.html)
        if (offset) opt['skip'] = offset;
        if (limit > -1) opt['limit'] = limit;

        return this.readyForQuery
            .then(() => this.db.query('all', opt))
            .then(result => this.filterResult(this.docsFromResult(result)));
    }

    public setupSync(url: string): Promise<SyncState> {

        return this.readyForQuery.then(() => {
            let sync = this.db.sync(url, { live: true, retry: true });
            this.syncHandles.push(sync);
            return {
                url: url,
                cancel: () => sync.cancel(),
                onError: Observable.create(obs => sync.on('error', err => obs.onNext(err))),
                onPaused: Observable.create(obs => sync.on('paused', err => obs.onNext(err))),
                onActive: Observable.create(obs => sync.on('active', () => obs.onNext()))
            }
        });
    }

    public stopSync() {
        for (let handle of this.syncHandles) {
            console.log("stop sync",handle);
            handle.cancel();
        }
        this.syncHandles = [];
    }

    private fetchObject(id: string): Promise<Document> {
        // Beware that for this to work we need to make sure
        // the document _id/id and the resource.id are always the same.
        return this.db.get(id, { conflicts: true })
            .catch(err => Promise.reject([M.DATASTORE_NOT_FOUND]))
    }

    private docsFromResult(result: any[]): Document[] {
        return result['rows'].map(row => this.cleanDoc(row.doc));
    }

    // strips document of any properties that are only
    // used to simplify index creation
    private cleanDoc(doc: Document): Document {
        if (doc && doc.resource) {
            delete doc.resource['_parentTypes'];
        }
        return doc;
    }

    // only return every doc once by using Set
    private filterResult(docs: Document[]): Document[] {

        const set: Set<string> = new Set<string>();
        let filtered = [];
        docs.forEach(doc => {
            if (!set.has(doc.resource.id)) {
                set.add(doc.resource.id);
                filtered.push(doc);
            }
        });
        return filtered;
    }

    private setupChangesEmitter(): void {

        this.db.changes({
            live: true,
            include_docs: true,
            since: 'now'
        }).on('change', change => {
            if (change && change['id'] && (change['id'].indexOf('_design') == 0)) return; // starts with _design
            if (!change || !change.doc) return;
            if (this.observers && Array.isArray(this.observers)) this.observers.forEach( observer => {
                if (observer && (observer.next != undefined)) {
                    observer.next(this.cleanDoc(change.doc));
                }
            });
        }).on('complete', info => {
            console.error("changes stream was canceled", info);
        }).on('error', err => {
            console.error("changes stream errored", err);
        });
    }

    private loadSampleData(): Promise<any> {

        return new Promise<any>((resolve, reject)=>{

            let promises = [];
            for (let doc of DOCS) promises.push(this.create(doc,  true));

            Promise.all(promises)
                .then(() => {
                    console.debug("Successfully stored sample documents");
                    resolve();
                })
                .catch(err => {console.error("Problem when storing sample data", err); reject();});
        });
    }
}
