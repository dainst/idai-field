import { Observable, Observer } from 'rxjs';
import { PouchdbManager } from '../../datastore/pouchdb/pouchdb-manager';
import { ObserverUtil } from '../../tools/observer-util';


export interface SyncProcess {

    url: string;
    cancel(): void;
    observer: Observable<SyncStatus>;
}


export enum SyncStatus {

    Offline = 'OFFLINE',
    Pushing = 'PUSHING',
    Pulling = 'PULLING',
    InSync = 'IN_SYNC',
    Error = 'ERROR',
    AuthenticationError = 'AUTHENTICATION_ERROR',
    AuthorizationError = 'AUTHORIZATION_ERROR'
}


export namespace SyncProcess {

    export function generateUrl(syncTarget: string, project: string, password: string) {

        if (syncTarget.indexOf('http') == -1) syncTarget = 'http://' + syncTarget;

        return !password
            ? syncTarget
            : syncTarget.replace(/(https?):\/\//, '$1://' +
                project + ':' + password + '@');
    }
}


export namespace SyncStatus {

    export const getFromInfo = (info: any) =>
    info.direction === 'push' ? SyncStatus.Pushing : SyncStatus.Pulling;


    export const getFromError = (err: any) =>
        err.status === 401
            ? err.reason === 'Name or password is incorrect.'
                ? SyncStatus.AuthenticationError
                : SyncStatus.AuthorizationError
            : SyncStatus.Error;
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


    public constructor(private pouchdbManager: PouchdbManager) {}


    public getStatus = (): SyncStatus => this.status;


    public init(syncTarget: string, project: string, password: string) {

        this.syncTarget = syncTarget;
        this.project = project;
        this.password = password;
    }


    public statusNotifications = (): Observable<SyncStatus> => ObserverUtil.register(this.statusObservers);


    public async startSync() {

        if (!this.syncTarget || !this.project) return;

        if (this.currentSyncTimeout) clearTimeout(this.currentSyncTimeout);

        const url = SyncProcess.generateUrl(this.syncTarget, this.project, this.password);
        
        const syncProcess = await this.setupSync(url, this.project);
        syncProcess.observer.subscribe(
            status => this.setStatus(status),
            err => {
                const syncStatus = SyncStatus.getFromError(err);
                if (syncStatus !== SyncStatus.AuthenticationError
                    && syncStatus !== SyncStatus.AuthorizationError) {
                
                        console.error('SyncService.startSync received error from pouchdbManager.setupSync', err);
                }
                this.setStatus(syncStatus);
                syncProcess.cancel();
                this.currentSyncTimeout = setTimeout(() => this.startSync(), 5000); // retry
            }
        );
    }


    public stopSync() {

        if (this.currentSyncTimeout) clearTimeout(this.currentSyncTimeout);
        this._stopSync();
        this.setStatus(SyncStatus.Offline);
    }


    public setStatus(status: SyncStatus) {

        this.status = status;
        ObserverUtil.notify(this.statusObservers, this.status);
    }


    // TODO make private and use startSync
    /**
     * Setup peer-to-peer syncing between this datastore and target.
     * Changes to sync state will be published via the onSync*-Methods.
     * @param url target datastore
     * @param project
     */
    public async setupSync(url: string, project: string, filter?: (doc: any) => boolean): Promise<SyncProcess> {

        const fullUrl = url + '/' + (project === 'synctest' ? 'synctestremotedb' : project); // TODO review if SyncProcess.generateUrl should do this, too
        console.log('Start syncing');

        let sync = this.pouchdbManager.getDb().sync(fullUrl, { live: true, retry: false, filter });

        this.syncHandles.push(sync as never);
        return {
            url: url,
            cancel: () => {
                sync.cancel();
                this.syncHandles.splice(this.syncHandles.indexOf(sync as never), 1);
            },
            observer: Observable.create((obs: Observer<SyncStatus>) => {
                sync.on('change', (info: any) => obs.next(SyncStatus.getFromInfo(info)))
                    .on('paused', () => obs.next(SyncStatus.InSync))
                    .on('active', () => obs.next(SyncStatus.Pulling))
                    .on('complete', (info: any) => {
                        obs.next(SyncStatus.Offline);
                        obs.complete();
                    })
                    .on('error', (err: any) => obs.error(err));
            })
        };
    }


    // TODO make private and use stopSync
    public _stopSync() {

        console.log('Stop syncing');

        for (let handle of this.syncHandles) {
            (handle as any).cancel();
        }
        this.syncHandles = [];
    }
}
