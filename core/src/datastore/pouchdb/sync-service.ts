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

        if (this.currentSyncTimeout) clearTimeout(this.currentSyncTimeout);
        console.log('Stop syncing');
        for (let handle of this.syncHandles) (handle as any).cancel();
        this.syncHandles = [];
        this.setStatus(SyncStatus.Offline);
    }


    public async startSyncWithRetry(filter?: (doc: any) => boolean) { // TODO does not need to be async

        if (!this.syncTarget || !this.project) return;

        if (this.currentSyncTimeout) clearTimeout(this.currentSyncTimeout);

        this.startSync(filter).subscribe(
            _ => {},
            _ => {
                for (let handle of this.syncHandles) (handle as any).cancel();
                this.syncHandles = [];
                this.currentSyncTimeout = setTimeout(() => this.startSyncWithRetry(), 5000); // retry
            }
        );
    }


    /**
     * Setup peer-to-peer syncing between this datastore and target.
     * Changes to sync state will be published via the onSync*-Methods.
     * @param url target datastore
     * @param project
     */
    public startSync(filter?: (doc: any) => boolean): Observable<SyncStatus> {

        if (!this.syncTarget || !this.project) return;
        if (this.syncHandles.length > 0) {
            console.warn('sync already running, will not \'startSync\' again'); // TODO this does not seem to be enough; from mobile, at startup, there are two calls to startSync, of which the second comes then presumably before we have a sync handle
            return;
        }

        const url = SyncService.generateUrl(this.syncTarget, this.project, this.password);

        const fullUrl = url + '/' + (this.project === 'synctest' ? 'synctestremotedb' : this.project); // TODO review if SyncProcess.generateUrl should do this, too
        console.log('Start syncing', fullUrl);

        let sync = this.pouchdbDatastore.getDb().sync(fullUrl, { live: true, retry: false, filter });

        this.syncHandles.push(sync as never);
        return Observable.create((obs: Observer<SyncStatus>) => {
            sync.on('change', (info: any) => {
                    this.setStatus(SyncService.getFromInfo(info));
                })
                .on('paused', () => {
                    this.setStatus(SyncStatus.InSync);
                })
                .on('active', () => {
                    this.setStatus(SyncStatus.Pulling);
                })
                .on('complete', (info: any) => {
                    this.setStatus(SyncStatus.Offline);
                    obs.complete();
                })
                .on('error', (err: any) => {
                    const syncStatus = SyncService.getFromError(err);
                    if (syncStatus !== SyncStatus.AuthenticationError
                        && syncStatus !== SyncStatus.AuthorizationError) {
                            
                            console.error('SyncService.startSync received error from pouchdbManager.setupSync', err);
                        }
                    this.setStatus(syncStatus);
                    obs.error(err);
                });
        });
    }


    private setStatus(status: SyncStatus) {

        this.status = status;
        ObserverUtil.notify(this.statusObservers, this.status);
    }


    private static generateUrl(syncTarget: string, project: string, password: string) {

        if (syncTarget.indexOf('http') == -1) syncTarget = 'http://' + syncTarget;

        // const fullUrl = url.replace(/(https?:\/\/)/, `$1${project}:${password}@`);
        return !password
            ? syncTarget
            : syncTarget.replace(/(https?):\/\//, '$1://' +
                project + ':' + password + '@');
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
