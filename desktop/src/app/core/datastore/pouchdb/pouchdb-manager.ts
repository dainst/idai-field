import { Document, DocumentCache, IndexFacade, Name } from 'idai-field-core';
import { Observable, Observer } from 'rxjs';
import { isUndefined, not } from 'tsfun';
import { ConfigurationErrors } from '../../configuration/boot/configuration-errors';
import { InitializationProgress } from '../../initialization-progress';
import { SyncProcess, SyncStatus } from '../../sync/sync-process';
import { FieldCategoryConverter } from '../field/field-category-converter';

const PouchDB = typeof window !== 'undefined' ? window.require('pouchdb-browser') : require('pouchdb-node');


/**
 * Manages the creation and synchronization of PouchDB instances.
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class PouchdbManager {

    private db: PouchDB.Database;

    private syncHandles = [];


    public getDb = (): PouchDB.Database => this.db;


    /**
     * Destroys the db named dbName, if it is not the currently selected active database
     * @throws if trying do delete the currently active database
     */
    public destroyDb = (dbName: string) => PouchdbManager.createPouchDBObject(dbName).destroy();


    // TODO still necessary?
    public async resetForE2E() {

        if (this.db) {
            await this.db.close();
            this.db = undefined;
        }
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

        let sync = this.db.sync(fullUrl, { live: true, retry: false });

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
                    .on('active', () => obs.next(SyncStatus.Pulling))
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

        this.db = db;
    }

    // TODO: Move to index
    public async reindex(indexFacade: IndexFacade, documentCache: DocumentCache<Document>,
                         converter: FieldCategoryConverter, progress?: InitializationProgress) {

        if (progress) {
            progress.setDocumentsToIndex((await this.db.info()).doc_count);
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

        return (await this.db
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
