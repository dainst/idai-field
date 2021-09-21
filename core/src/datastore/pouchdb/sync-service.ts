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
    public async startOneTimeSync(target: string, password: string, project: string): Promise<Observable<SyncStatus>> {

        const url = SyncService.generateUrl(target, project, password);

        console.log('url', url);

        const db = await this.pouchdbDatastore.createEmptyDb(project); // may throw, if not empty

        const sync = db.replicate.from(url, { live: false, retry: true }); // TODO review how retry works

        // TODO deduplicate with code below in setupSync
        return Observable.create((obs: Observer<SyncStatus>) => {
            sync.on('change', (info: any) => obs.next(SyncService.getFromInfo(info)))
                .on('paused', () => obs.next(SyncStatus.InSync))
                .on('active', () => obs.next(SyncStatus.Pulling))
                .on('complete', (info: any) => {
                    obs.next(SyncStatus.Offline);
                    obs.complete();
                })
                .on('error', (err: any) => {
                
                    // it's ok to remove db, because we know by know it was a new one
                    this.pouchdbDatastore.destroyDb(project);

                    obs.error(err);
                });
        })
    };


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

        this.sync = this.pouchdbDatastore.getDb().sync(url, { filter });
        this.handleStatus(this.sync);

        this.sync.on('complete', () => this.syncTimeout = setTimeout(() => this.startLiveSync(url, filter), 1000));
        this.sync.on('error', () => this.syncTimeout = setTimeout(() => this.startLiveSync(url, filter), 1000));
    }


    private handleStatus(sync: Sync): void {
        
        sync.on('change', info => this.setStatus(SyncService.getFromInfo(info)))
            .on('complete', () => this.setStatus(SyncStatus.InSync))
            .on('denied', err => console.error('Document denied in sync', err))
            .on('error', err => {
                this.setStatus(SyncService.getFromError(err));
                console.error('SyncService received error from PouchDB', err);
            });
    }


    private setStatus(status: SyncStatus) {

        this.status = status;
        ObserverUtil.notify(this.statusObservers, this.status);
    }


    private static generateUrl(syncTarget: string, project: string, password: string) {

        if (syncTarget.indexOf('http') == -1) syncTarget = 'http://' + syncTarget;

        const url = !password
            ? syncTarget
            : syncTarget.replace(/(https?):\/\//, '$1://' +
                project + ':' + password + '@');

        return url + '/' + (project === 'synctest' ? 'synctestremotedb' : project); 
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
