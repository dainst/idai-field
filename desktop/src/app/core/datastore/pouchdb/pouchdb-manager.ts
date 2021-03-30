import { Injectable } from '@angular/core';
import { IndexFacade, Name, PouchdbProxy } from '@idai-field/core';
import { Document } from 'idai-components-2';
import { Observable, Observer } from 'rxjs';
import { isUndefined, not } from 'tsfun';
import { ConfigurationErrors } from '../../configuration/boot/configuration-errors';
import { InitializationProgress } from '../../initialization-progress';
import { SyncProcess, SyncStatus } from '../../sync/sync-process';
import { DocumentCache } from '../cached/document-cache';
import { FieldCategoryConverter } from '../field/field-category-converter';
import { SampleDataLoader } from '../field/sampledata/sample-data-loader';

const PouchDB = typeof window !== 'undefined' ? window.require('pouchdb-browser') : require('pouchdb-node');


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
    public getDbProxy = (): PouchdbProxy => this.dbProxy;


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
     * @param project
     */
    public async setupSync(url: string, project: Name): Promise<SyncProcess> {

        const fullUrl = url + '/' + (project === 'synctest' ? 'synctestremotedb' : project);
        console.log('Start syncing');

        let db = await this.getDbProxy().ready();
        let sync = db.sync(fullUrl, { live: true, retry: false });

        this.syncHandles.push(sync as never);
        return {
            url: url,
            cancel: () => {
                sync.cancel();
                this.syncHandles.splice(this.syncHandles.indexOf(sync as never), 1);
            },
            observer: Observable.create((obs: Observer<SyncStatus>) => {
                sync.on('change', (info: any) => obs.next(getSyncStatusFromInfo(info)))
                    .on('paused', () => obs.next(SyncStatus.InSync))
                    .on('active', (info: any) => obs.next(getSyncStatusFromInfo(info)))
                    .on('complete', (info: any) => {
                        obs.next(SyncStatus.Offline);
                        obs.complete();
                    })
                    .on('error', (err: any) => obs.error(getSyncStatusFromError(err)));
            })
        };
    }


    public stopSync() {

        console.log('Stop syncing');

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


    public async reindex(indexFacade: IndexFacade, documentCache: DocumentCache<Document>,
                         converter: FieldCategoryConverter, progress?: InitializationProgress) {

        if (progress) {
            progress.setDocumentsToIndex((await this.dbHandle.info()).doc_count);
            await progress.setPhase('loadingDocuments');
        }

        indexFacade.clear();

        let documents = [];
        try {
            documents = await this.fetchAll();
        } catch (err) {
            console.error(err);
            await progress.setError('fetchDocumentsError');
            throw err;
        }

        if (progress) await progress.setPhase('indexingDocuments');

        try {
            documents = this.convertDocuments(documents, converter);
            documents.forEach(doc => documentCache.set(doc));
            await indexFacade.putMultiple(documents, progress ? (count: number) => progress.setIndexedDocuments(count) : undefined);
        } catch (err) {
            console.error(err);
            await progress.setError('indexingError');
            throw err;
        }
    }


    private async fetchAll() {

        return (await this.dbHandle
            .allDocs({
                include_docs: true,
                conflicts: true
            })).rows
            .filter(row => !PouchdbManager.isDesignDoc(row))
            .map(row => row.doc);
    }


    private convertDocuments(documents: Array<Document>, converter: FieldCategoryConverter): Array<Document> {

        return documents.map(doc => {
            try {
                return converter.convert(doc);
            } catch (err) {
                if (err.length > 0 && err[0] === ConfigurationErrors.UNKNOWN_CATEGORY_ERROR) {
                    console.warn('Unknown category: ' + err[1]);
                    return undefined;
                }
            }
        }).filter(not(isUndefined));
    }


    private static createPouchDBObject(name: string): any {

        return new PouchDB(name);
    }


    private static isDesignDoc = (row: any) => row.id.indexOf('_') === 0;
}


const getSyncStatusFromInfo = (info: any) =>
    info.direction === 'push' ? SyncStatus.Pushing : SyncStatus.Pulling;


const getSyncStatusFromError = (err: any) =>
    err.status === 401
        ? err.reason === 'Name or password is incorrect.'
            ? SyncStatus.AuthenticationError
            : SyncStatus.AuthorizationError
        : SyncStatus.Error;
