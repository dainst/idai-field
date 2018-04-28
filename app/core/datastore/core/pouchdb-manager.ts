import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import * as PouchDB from 'pouchdb';
import {PouchdbProxy} from './pouchdb-proxy';
import {SampleDataLoader} from './sample-data-loader';
import {SyncState} from './sync-state';
import {IndexFacade} from '../index/index-facade';

const remote = require('electron').remote;


@Injectable()
/**
 * Manages the creation of PouchDB instances.
 * Also handles loading of sample data if 'test' database is selected.
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class PouchdbManager {

    private dbHandle: any = undefined;
    private dbProxy: PouchdbProxy;
    private syncHandles = [];

    private sampleDataLoader: SampleDataLoader;
    private resolveDbReady: Function;


    constructor(private indexFacade: IndexFacade) {

        const dbReady = new Promise(resolve => this.resolveDbReady = resolve as any);
        this.dbProxy = new PouchdbProxy(dbReady);
    }


    /**
     * @returns {PouchdbProxy} a proxy that automatically hands over method
     *  calls to the actual PouchDB instance as soon as it is available
     */
    public getDbProxy = () => this.dbProxy;


    /**
     * Destroys the db named dbName, if it is not the currently selected active database
     * @throws if trying do delete the currently active database
     */
    public destroyDb = (dbName: string) => PouchdbManager.createPouchDBObject(dbName).destroy();


    public async resetForE2E() {

        const dbReady = new Promise(resolve => this.resolveDbReady = resolve);
        Object.assign(this.dbProxy, new PouchdbProxy(dbReady));

        if (this.dbHandle) {
            await this.dbHandle.close();
            this.dbHandle = undefined;
        }
        if (this.sampleDataLoader) await this.loadProjectDb('test', this.sampleDataLoader);
    }


    public async loadProjectDb(name: string, sampleDataLoader?: SampleDataLoader) {

        let db = await PouchdbManager.createPouchDBObject(name);

        if (name === 'test' && sampleDataLoader) {
            this.sampleDataLoader = sampleDataLoader;
            await db.destroy();
            db = await PouchdbManager.createPouchDBObject(name);
            await sampleDataLoader.go(db, name);
        }

        this.indexFacade.clear();
        await PouchdbManager.fetchAll(db,
            (doc: any) => this.indexFacade.put(doc, true, false)
        );
        this.resolveDbReady(db);
        this.dbHandle = db;
    }


    /**
     * Setup peer-to-peer syncing between this datastore and target.
     * Changes to sync state will be published via the onSync*-Methods.
     * @param url target datastore
     */
    public setupSync(url: string, projectName: string): Promise<SyncState> {

        const fullUrl = url + '/' + projectName;
        console.log('start syncing');

        return (this.getDbProxy() as any).ready().then((db: any) => {
            let sync = db.sync(fullUrl, { live: true, retry: false });
            this.syncHandles.push(sync as never);
            return {
                url: url,
                cancel: () => {
                    sync.cancel();
                    this.syncHandles.splice(this.syncHandles.indexOf(sync as never), 1);
                },
                onError: Observable.create((obs: any) => sync.on('error', (err: any) => obs.next(err))),
                onChange: Observable.create((obs: any) => sync.on('change', () => obs.next()))
            };
        });
    }


    public stopSync() {

        console.log('stop sync');

        for (let handle of this.syncHandles) {
            console.debug('stop sync', handle);
            (handle as any).cancel();
        }
        this.syncHandles = [];
    }


    /**
     * Creates a new database. Unless specified specifically
     * with destroyBeforeCreate set to true,
     * a possible existing database with the specified name will get used
     * and not overwritten.
     */
    public async createDb(name: string, doc: any, destroyBeforeCreate: boolean) {

        let db = PouchdbManager.createPouchDBObject(name);

        if (destroyBeforeCreate) {
            await db.destroy();
            db = PouchdbManager.createPouchDBObject(name)
        }

        try {
            db.get(name)
        } catch (_) {
            // create project only if it does not exist,
            // which can happen if the db already existed
            db.put(doc);
        }
    }


    private static async fetchAll(db:any, forEach: Function) {

        await db
            .allDocs({
                    include_docs: true,
                    conflicts: true
                },
                (err: any, resultDocs: any) => {
                    (resultDocs.rows as Array<any>)
                        .filter(row => !PouchdbManager.isDesignDoc(row))
                        .forEach(row => forEach(row.doc));
                });
    }


    private static createPouchDBObject(name: string): any {

        const db: any = new PouchDB(name);
        if (console.debug) console.debug('PouchDB is using adapter', db.adapter);
        return db;
    }


    private static isDesignDoc(row: any) {

        return row.id.indexOf('_') == 0
    }
}