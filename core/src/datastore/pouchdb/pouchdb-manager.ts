import { Observable, Observer } from 'rxjs';
import { SyncProcess, SyncStatus } from '../../sync/sync-process';
import { PouchDbFactory } from './types';


/**
 * Manages the creation and synchronization of PouchDB instances.
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class PouchdbManager {

    private db: PouchDB.Database;

    private syncHandles = [];


    constructor(private pouchDbFactory: PouchDbFactory) {}


    public getDb = (): PouchDB.Database => this.db;

    /**
     * Destroys the db named dbName, if it is not the currently selected active database
     * @throws if trying do delete the currently active database
     */
    public destroyDb = (dbName: string) => this.pouchDbFactory(dbName).destroy();


    public createDb_e2e(dbName: string) {
     
        this.db = this.pouchDbFactory(dbName);
        return this.db;
    }


    /**
     * Setup peer-to-peer syncing between this datastore and target.
     * Changes to sync state will be published via the onSync*-Methods.
     * @param url target datastore
     * @param project
     */
    public async setupSync(url: string, project: string, filter?: (doc: any) => boolean): Promise<SyncProcess> {

        const fullUrl = url + '/' + (project === 'synctest' ? 'synctestremotedb' : project);
        console.log('Start syncing');

        let sync = this.db.sync(fullUrl, { live: true, retry: false, filter });

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
    public async createDb(name: string, doc: any, destroyBeforeCreate: boolean): Promise<PouchDB.Database> {

        let db = this.pouchDbFactory(name);

        if (destroyBeforeCreate) {
            await db.destroy();
            db = this.pouchDbFactory(name);
        }

        try {
            await db.get('project');
        } catch {
            // create project only if it does not exist,
            // which can happen if the db already existed
            await db.put(doc);
        }

        this.db = db;

        return db;
    }
}


const getSyncStatusFromInfo = (info: any) =>
    info.direction === 'push' ? SyncStatus.Pushing : SyncStatus.Pulling;


const getSyncStatusFromError = (err: any) =>
    err.status === 401
        ? err.reason === 'Name or password is incorrect.'
            ? SyncStatus.AuthenticationError
            : SyncStatus.AuthorizationError
        : SyncStatus.Error;
