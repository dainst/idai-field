import { Observable, Observer } from 'rxjs';
import { ObserverUtil } from '../../tools/observer-util';
import { PouchdbDatastore } from './pouchdb-datastore';
import { SyncStatus } from '../sync-status';

type ReplicationHandle = PouchDB.Replication.ReplicationEventEmitter<unknown, unknown, unknown>;


interface SyncProcess {

    url: string;
    cancel(): void;
    observer: Observable<SyncStatus>;
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

    private sync: ReplicationHandle = null;
    private replication: ReplicationHandle = null;

    private statusObservers: Array<Observer<SyncStatus>> = [];


    public constructor(private pouchdbDatastore: PouchdbDatastore) {}


    public getStatus = (): SyncStatus => this.status;


    public init(syncTarget: string, project: string, password: string) {

        this.syncTarget = syncTarget;
        this.project = project;
        this.password = password;
    }


    public statusNotifications = (): Observable<SyncStatus> => ObserverUtil.register(this.statusObservers);


    /**
     * @throws error if db is not empty
     */
    public async startReplication(target: string, password: string, project: string, updateSequence: number,
                                  destroyExisting: boolean): Promise<Observable<any>> {

        if (this.replication) {
            console.warn('replication already running, will not start replication again');
            return;
        }

        this.stopSync();

        const url: string = SyncService.generateUrl(target, project, password);

        const db = await this.pouchdbDatastore.createEmptyDb(project, destroyExisting); // may throw, if not empty

        this.replication = db.replicate.from(
            url,
            {
                retry: true,
                batch_size: updateSequence < 200 ? 10 : 50,
                batches_limit: 1,
                timeout: 600000
            }
        );

        return Observable.create((obs: Observer<any>) => {
            this.replication.on('change', (info: any) => { obs.next(info.last_seq); })
                .on('complete', (info: any) => {
                    this.replication = undefined;
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
        this.replication = undefined;
        this.startSync();
        observer.error(error);
    }


    public async stopReplication() {

        if (!this.replication) return;

        this.replication.cancel();
        this.replication = undefined;
    }


    public async startSync(filter?: (doc: any) => boolean) {

        if (!this.syncTarget || !this.project) return;

        if (this.sync) {
            console.warn('sync already running, will not start sync again');
            return;
        }

        if (this.currentSyncTimeout) clearTimeout(this.currentSyncTimeout);

        const url = SyncService.generateUrl(this.syncTarget, this.project, this.password);
        
        const syncProcess: SyncProcess = await this.setupSync(url, filter);
        syncProcess.observer.subscribe(
            status => this.setStatus(status),
            err => {
                const syncStatus = SyncService.getStatusFromError(err);
                if (syncStatus !== SyncStatus.AuthenticationError && syncStatus !== SyncStatus.AuthorizationError) {
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
        if (this.sync) this.sync.cancel();
        this.sync = null;
        this.setStatus(SyncStatus.Offline);
    }


    public setStatus(status: SyncStatus) {

        this.status = status;
        ObserverUtil.notify(this.statusObservers, this.status);
    }


    private async setupSync(url: string, filter?: (doc: any) => boolean): Promise<SyncProcess> {

        console.log('Start syncing', url);

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

        return {
            url: url,
            cancel: () => {
                this.sync.cancel();
                this.sync = null;
            },
            observer: Observable.create((obs: Observer<SyncStatus>) => {
                this.sync.on('change', (info: any) => obs.next(SyncService.getStatusFromInfo(info)))
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


    public static generateUrl(syncTarget: string, project: string, password?: string) {

        if (syncTarget.indexOf('http') == -1) syncTarget = 'http://' + syncTarget;

        const url = !password
            ? syncTarget
            : syncTarget.replace(/(https?):\/\//, '$1://' +
                project + ':' + encodeURIComponent(password) + '@');

        return url + '/db/' + project;
    }


    private static getStatusFromInfo = (info: any): SyncStatus =>
        info.direction === 'push' ? SyncStatus.Pushing : SyncStatus.Pulling;


    private static getStatusFromError = (err: any): SyncStatus =>
        err.status === 401
            ? err.reason === 'Name or password is incorrect.'
                ? SyncStatus.AuthenticationError
                : SyncStatus.AuthorizationError
            : SyncStatus.Error;
}
