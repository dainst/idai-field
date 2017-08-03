import * as PouchDB from "pouchdb";
import {IndexCreator} from "./index-creator";
import {PouchdbProxy} from "./pouchdb-proxy";
import {Injectable} from "@angular/core";
import {AbstractSampleDataLoader} from "./abstract-sample-data-loader";
import {Observable} from 'rxjs/Observable';
import {SyncState} from './sync-state';
import {Document} from 'idai-components-2/core';

@Injectable()
/**
 * Manages the creation of PouchDB instances.
 * Also handles loading of sample data if 'test' database is selected.
 * @author Sebastian Cuy
 */
export class PouchdbManager {

    private db = undefined;
    private dbProxy = undefined;
    private name:string = undefined;
    private indexCreator = new IndexCreator();
    private syncHandles = [];
    private observers = [];

    private resolveDbReady = undefined;

    constructor(private sampleDataLoader: AbstractSampleDataLoader) {
        let dbReady = new Promise(resolve => this.resolveDbReady = resolve);
        this.dbProxy = new PouchdbProxy(dbReady);
    }

    /**
     * @param name
     */
    public create(name: string): void {
        this.switchProject(name, true);
    }

    /**
     * Selects the current database.
     * This (or {@link PouchdbManager#create}) has to be called before the database can be used.
     * @param name the database name
     */
    public select(name: string): void {
        this.switchProject(name, false);
    }

    private switchProject(name: string, destroy: boolean) {
        // same db selected, no need for action
        if (this.name == name) return;

        this.stopSync();

        let rdy: Promise<any> = Promise.resolve();

        if (this.db) {
            let dbReady = new Promise(resolve => this.resolveDbReady = resolve);
            this.dbProxy.switchDb(dbReady);
            rdy = rdy.then(() => this.db.close());
        }

        this.name = name;

        rdy = rdy.then(() => this.createDb());
        if ((name == 'test') || destroy) {
            rdy = rdy.then(() => this.db.destroy()).then(() => this.createDb());
        }
        rdy = rdy.then(() => this.indexCreator.go(this.db));
        if (name == 'test') {
            rdy = rdy.then(config => this.sampleDataLoader.go(this.db, this.name));
        }
        rdy.then(() => this.resolveDbReady(this.db));
    }

    public getIndexCreator() {
        return this.indexCreator;
    }


    /**
     * Setup peer-to-peer syncing between this datastore and target.
     * Changes to sync state will be published via the onSync*-Methods.
     * @param url target datastore
     */
    public setupSync(url: string): Promise<SyncState> {

        let fullUrl = url + '/' + this.name;
        console.log('start syncing with ' + fullUrl);

        return this.getDb().rdy.then(db => {
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

    private stopSync() {

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

    public destroy(): Promise<any> {
        // TODO wait for rdy
        return this.db.destroy();
    }

    // TODO reject if dbName is not this.name
    public destroyDb(dbName: string): Promise<any> {
        return new PouchDB(dbName).destroy();
    }

    private createDb(): Promise<any> {
        this.db = new PouchDB(this.name);
        return Promise.resolve(this.db);
    }

    // TODO remove duplicate code, put to model package
    // strips document of any properties that are only
    // used to simplify index creation
    private cleanDoc(doc: Document): Document {

        if (doc && doc.resource) {
            delete doc.resource['_parentTypes'];
        }
        return doc;
    }

    public addObserver(observer) {
        this.observers.push(observer);
    }

    // TODO make private, switch if db switches
    public setupChangesEmitter(): void {

        this.getDb().rdy.then(db => {
            db.changes({
                live: true,
                include_docs: true,
                conflicts: true,
                since: 'now'
            }).on('change', change => {
                if (change && change['id'] && (change['id'].indexOf('_design') == 0)) return; // starts with _design
                if (!change || !change.doc) return;
                if (this.observers && Array.isArray(this.observers)) this.observers.forEach(observer => {
                    if (observer && (observer.next != undefined)) {
                        observer.next(this.cleanDoc(change.doc));
                    }
                });
            }).on('complete', info => {
                console.error('changes stream was canceled', info);
            }).on('error', err => {
                console.error('changes stream errored', err);
            });
        });
    }
}