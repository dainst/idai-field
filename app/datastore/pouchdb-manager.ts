import * as PouchDB from "pouchdb";
import {PouchdbProxy} from "./pouchdb-proxy";
import {Injectable} from "@angular/core";
import {AbstractSampleDataLoader} from "./abstract-sample-data-loader";
import {SyncState} from './sync-state';
import {Observable} from 'rxjs/Observable';
import {ConstraintIndexer} from "./constraint-indexer";
import {FulltextIndexer} from "./fulltext-indexer";
import {DocumentCache} from "./document-cache";
const remote = require('electron').remote;

@Injectable()
/**
 * Manages the creation of PouchDB instances.
 * Also handles loading of sample data if 'test' database is selected.
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class PouchdbManager {

    private db = undefined;
    private dbProxy: PouchdbProxy = undefined;
    private name: string = undefined;
    private syncHandles = [];

    private resolveDbReady = undefined;

    constructor(
        private sampleDataLoader: AbstractSampleDataLoader,
        private constraintIndexer: ConstraintIndexer,
        private fulltextIndexer: FulltextIndexer,
        private documentCache: DocumentCache) {

        let dbReady = new Promise(resolve => this.resolveDbReady = resolve);
        this.dbProxy = new PouchdbProxy(dbReady);
    }

    public setProject(name: string) {

        this.name = name;

        let rdy: Promise<any> = Promise.resolve();

        if (this.db) {
            rdy = rdy.then(() => {
                this.db.close();
                this.db = undefined;
            });
        }

        rdy = rdy.then(() => this.createPouchDBObject(name));
        if ((name == 'test')) {
            rdy = rdy.then(() => this.db.destroy()).then(() => this.createPouchDBObject(name));
        }
        if (name == 'test') {
            rdy = rdy.then(config => this.sampleDataLoader.go(this.db, this.name));
        }

        rdy.then(() => this.index());
    }

    /**
     * Setup peer-to-peer syncing between this datastore and target.
     * Changes to sync state will be published via the onSync*-Methods.
     * @param url target datastore
     */
    public setupSync(url: string): Promise<SyncState> {

        let fullUrl = url + '/' + this.name;
        console.log('start syncing');

        return this.getDb().ready().then(db => {
            let sync = db.sync(fullUrl, { live: true, retry: false });
            this.syncHandles.push(sync);
            return {
                url: url,
                cancel: () => {
                    sync.cancel();
                    this.syncHandles.splice(this.syncHandles.indexOf(sync), 1);
                },
                onError: Observable.create(obs => sync.on('error', err => obs.next(err))),
                onChange: Observable.create(obs => sync.on('change', () => obs.next()))
            };
        });
    }

    public stopSync() {

        console.log('stop sync');

        for (let handle of this.syncHandles) {
            console.debug('stop sync', handle);
            handle.cancel();
        }
        this.syncHandles = [];
    }

    /**
     * Gets the database object.
     * @returns {PouchdbProxy} a proxy that automatically hands over method
     *  calls to the actual PouchDB instance as soon as it is available
     */
    public getDb(): PouchdbProxy {

        return this.dbProxy;
    }

    /**
     * Destroys the db named dbName, if it is not the currently selected active database
     *
     * @param dbName
     * @returns {any}
     *   Rejects with undefined if trying do delete the currently active database
     */
    public destroyDb(dbName: string): Promise<any> {

        return this.createPouchDBObject(dbName).destroy();
    }

    /**
     * Creates a new database. Unless specified specifically
     * with remote.getGlobal('switches').destroy_before_create set to true,
     * a possible existing database with the specified name will get used
     * and not overwritten.
     *
     */
    public createDb(name: string, doc) {

        let db = this.createPouchDBObject(name);

        let promise = Promise.resolve();
        if (remote.getGlobal('switches') && remote.getGlobal('switches').destroy_before_create) {
            promise = db.destroy().then(() =>
                    db = this.createPouchDBObject(name)
                );
        }

        return promise
            .then(() => db.get(name)
                // create project only if it does not exist,
                // which can happen if the db already existed
                .catch(() => db.put(doc))
            );
    }

    private index() {

        return this.db.allDocs({include_docs: true, conflicts: true},(err, resultDocs) => {
            this.constraintIndexer.clear();
            this.fulltextIndexer.clear();
            this.documentCache.clear();

            for (let row of resultDocs.rows) {
                if (PouchdbManager.isDesignDoc(row)) continue;

                this.constraintIndexer.put(row.doc, true);
                this.fulltextIndexer.put(row.doc, true);

                this.documentCache.set(row.doc);
            }

            this.resolveDbReady(this.db)
        })
    }

    private createPouchDBObject(name: string): any {

        this.db = new PouchDB(name);
        console.debug('PouchDB is using adapter', this.db.adapter);
        return this.db;
    }

    private static isDesignDoc(row) {

        return row.id.indexOf('_') == 0
    }
}