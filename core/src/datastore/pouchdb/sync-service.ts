import { Observable, Observer } from 'rxjs';
import { ObserverUtil } from '../../tools/observer-util';
import { PouchdbDatastore } from './pouchdb-datastore';


export enum SyncStatus {

    Offline = 'OFFLINE',
    Pushing = 'PUSHING',
    Pulling = 'PULLING',
    InSync = 'IN_SYNC',
    Error = 'ERROR',
    AuthenticationError = 'AUTHENTICATION_ERROR',
    AuthorizationError = 'AUTHORIZATION_ERROR'
}


type Sync = PouchDB.Replication.ReplicationEventEmitter<unknown, unknown, unknown>;


/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class SyncService {

    private status: SyncStatus = SyncStatus.Offline;
    private syncTarget: string;
    private project: string;
    private password: string = '';
    private currentSyncTimeout: any;

    private syncHandles = [];
    private replicationHandle;

    private sync: Sync = null;
    private syncTimeout = null;
    private statusObservers: Array<Observer<SyncStatus>> = [];


    public constructor(private pouchdbDatastore: PouchdbDatastore) {}


    public getStatus = (): SyncStatus => this.status;


    public init(syncTarget: string, project: string, password: string) {

        this.syncTarget = syncTarget;
        this.project = project;
        this.password = password;
    }


    public statusNotifications = (): Observable<SyncStatus> => ObserverUtil.register(this.statusObservers);


    public stopSync() {

        console.log('Stop syncing');
        
        if (this.syncTimeout) clearTimeout(this.syncTimeout);

        if (this.sync) {
            this.sync.cancel();
            this.sync = null;
        }

        this.setStatus(SyncStatus.Offline);
    }

    
    /**
     * @throws error if db is not empty
     */
    public async startReplication(target: string, password: string, project: string, updateSequence: number,
                                  destroyExisting: boolean): Promise<Observable<any>> {

        if (this.replicationHandle) return;

        this.stopSync();

        const url = SyncService.generateUrl(target, project, password);

        const db = await this.pouchdbDatastore.createEmptyDb(project, destroyExisting); // may throw, if not empty

        this.replicationHandle = db.replicate.from(
            url,
            {
                retry: true,
                batch_size: updateSequence < 200 ? 10 : 50,
                batches_limit: 1,
                timeout: 600000
            }
        );

        return Observable.create((obs: Observer<any>) => {
            this.replicationHandle.on('change', (info: any) => { obs.next(info.last_seq); })
                .on('complete', (info: any) => {
                    this.replicationHandle = undefined;
                    if (info.status === 'complete') {
                        obs.complete();
                    } else {
                        this.pouchdbDatastore.destroyDb(project);
                        obs.error('canceled');
                    }
                    this.startSync();
                })
                .on('denied', (err: any) => {
                    this.handleReplicationError(obs, err, project);
                })
                .on('error', (err: any) => {
                    this.handleReplicationError(obs, err, project);
                });
        })
    };


    private handleReplicationError(observer: Observer<any>, error: any, project: string) {

        // it's ok to remove db, because we know it was a new one
        this.pouchdbDatastore.destroyDb(project);
        this.replicationHandle = undefined;
        this.startSync();
        observer.error(error);
    }


    public async stopReplication() {

        if (!this.replicationHandle) return;

        this.replicationHandle.cancel();
        this.replicationHandle = undefined;
    }


    /**
     * Setup peer-to-peer syncing between this datastore and target.
     * Changes to sync state will be published via the onSync*-Methods.
     * @param url target datastore
     * @param project
     */
     public startSync(live: boolean = true, filter?: (doc: any) => boolean): void {

        if (!this.syncTarget || !this.project) return;
        if (this.sync) {
            console.warn('sync already running, will not \'startSync\' again');
            return;
        }

        const url = SyncService.generateUrl(this.syncTarget, this.project, this.password);
        console.log('Start syncing', url);

        // Use single-shot replicate in order to speed up initial sync
        this.sync = this.pouchdbDatastore.getDb().replicate.from(url, { filter });
        this.handleStatus(this.sync);

        // Setup bidirectional sync when initial replicate has completed
        if (live) this.sync.on('complete', () => this.startLiveSync(url, filter));
    }


    private startLiveSync(url: string, filter?: (doc: any) => boolean) {

        this.sync = this.pouchdbDatastore.getDb().sync(
            url,
            {
                live: true,
                retry: false,
                batch_size: 50,
                batches_limit: 1,
                timeout: 600000,
                filter
            }
        );
        this.handleStatus(this.sync);

        this.sync.on('complete', () => this.syncTimeout = setTimeout(() => this.startLiveSync(url, filter), 1000));
        this.sync.on('error', () => this.syncTimeout = setTimeout(() => this.startLiveSync(url, filter), 1000));
    }


    private handleStatus(sync: Sync): void {
        
        sync.on('change', info => this.setStatus(SyncService.getFromInfo(info)))
            .on('complete', () => this.setStatus(SyncStatus.InSync))
            .on('paused', () => this.setStatus(SyncStatus.InSync))
            .on('denied', err => console.error('Document denied in sync', err))
            .on('error', err => {
                this.setStatus(SyncService.getFromError(err));
                console.error('SyncService received error from PouchDB', err, JSON.stringify(err));
            });
    }


    private setStatus(status: SyncStatus) {

        this.status = status;
        ObserverUtil.notify(this.statusObservers, this.status);
    }


    public static generateUrl(syncTarget: string, project: string, password?: string) {

        if (syncTarget.indexOf('http') == -1) syncTarget = 'http://' + syncTarget;

        const url = !password
            ? syncTarget
            : syncTarget.replace(/(https?):\/\//, '$1://' +
                project + ':' + encodeURIComponent(password) + '@');

        return url + '/' + project;
    }


    private static getFromInfo = (info: any) =>
        info.direction === 'push' ? SyncStatus.Pushing : SyncStatus.Pulling;


    private static getFromError = (err: any) =>
        err.status === 401
            ? err.reason === 'Name or password is incorrect.'
                ? SyncStatus.AuthenticationError
                : SyncStatus.AuthorizationError
            : SyncStatus.Error;
}
