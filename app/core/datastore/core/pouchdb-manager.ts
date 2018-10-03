import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import * as express from 'express';
import * as PouchDB from 'pouchdb';
import {PouchdbProxy} from './pouchdb-proxy';
import {SampleDataLoader} from './sample-data-loader';
import {SyncState} from './sync-state';
import {IndexFacade} from '../index/index-facade';

const expressPouchDB = require('express-pouchdb');


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


    constructor() {

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


    /**
     * Provides Fauxton
     */
    public setupServer(): Promise<any> {

        return new Promise(resolve => {
            const app = express();
            app.use('/', expressPouchDB(PouchDB, {
                mode: 'fullCouchDB',
                overrideMode: {
                    include: ['routes/fauxton']
                }
            }));
            app.listen(3000, function() {
                console.debug('PouchDB Server is listening on port 3000');
                resolve();
            });
        });
    }


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

        let db = PouchdbManager.createPouchDBObject(name);

        if (name === 'test' && sampleDataLoader) {
            this.sampleDataLoader = sampleDataLoader;
            await db.destroy();
            db = PouchdbManager.createPouchDBObject(name);
            await sampleDataLoader.go(db, name);
        }

        this.resolveDbReady(db);
        this.dbHandle = db;
    }


    /**
     * Setup peer-to-peer syncing between this datastore and target.
     * Changes to sync state will be published via the onSync*-Methods.
     * @param url target datastore
     */
    public setupSync(url: string, projectName: string): Promise<SyncState> {

        const fullUrl = url + '/' + (projectName === 'synctest' ? 'synctestremotedb' : projectName);
        console.debug('Start syncing');

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

        console.debug('Stop syncing');

        for (let handle of this.syncHandles) {
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
            await db.get('project');
        } catch (_) {
            // create project only if it does not exist,
            // which can happen if the db already existed
            await db.put(doc);
        }
    }


    public async reindex(indexFacade: IndexFacade) {

        await indexFacade.clear();
        await this.fetchAll(
        (doc: any) => {
            (indexFacade as IndexFacade).put(doc, true, false);
        });
    }


    private async fetchAll(forEach: Function) {

        await this.dbHandle
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

        return new PouchDB(name);
    }


    private static isDesignDoc(row: any) {

        return row.id.indexOf('_') == 0
    }
}