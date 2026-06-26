import { Observable, Observer, Subscription } from 'rxjs';
import { ObserverUtil } from '../../tools/observer-util';
import { PouchdbDatastore } from './pouchdb-datastore';
import { SyncStatus } from '../sync-status';


export interface SyncAuth {
    username: string;
    password: string;
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
    private checkDatabaseExistence: (url: string, auth?: SyncAuth) => Promise<boolean>;

    private sync: any = null;
    private replication: any = null;

    private syncStatusSubscription: Subscription = null;
    private statusObservers: Array<Observer<SyncStatus>> = [];


    public constructor(private pouchdbDatastore: PouchdbDatastore) {}


    public getStatus = (): SyncStatus => this.status;


    public init(syncTarget: string, project: string, password: string,
                checkDatabaseExistence: (url: string, auth?: SyncAuth) => Promise<boolean>) {

        this.syncTarget = syncTarget;
        this.project = project;
        this.password = password;
        this.checkDatabaseExistence = checkDatabaseExistence;
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

        const url: string = SyncService.generateUrl(target, project);
        const auth = SyncService.generateAuth(project, password);
        const db = await this.pouchdbDatastore.createEmptyDb(project, destroyExisting); // may throw, if not empty
        const options: any = {
            retry: true,
            batch_size: updateSequence < 200 ? 10 : 50,
            batches_limit: 1,
            timeout: 600000
        };
        if (auth) options.auth = auth;

        this.replication = db.replicate.from(
            url,
            options
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
        observer.error(error);
    }


    public async stopReplication() {

        if (!this.replication) return;

        this.replication.cancel();
        this.replication = undefined;
    }


    public async startSync(startSequence?: string|number, setConnectingStatus: boolean = true,
                           filter?: (doc: any) => boolean): Promise<boolean> {

        if (!this.syncTarget || !this.project) return false;

        if (this.sync) {
            console.warn('sync already running, will not start sync again');
            return false;
        }

        if (setConnectingStatus) this.setStatus(SyncStatus.Connecting);

        if (this.currentSyncTimeout) clearTimeout(this.currentSyncTimeout);

        const url = SyncService.generateUrl(this.syncTarget, this.project);
        const auth = SyncService.generateAuth(this.project, this.password);

        if (!(await this.checkDatabaseExistence(url, auth))) {
            this.setStatus(SyncStatus.AuthenticationError);
            return false;
        }
        
        const syncStatusObserver: Observable<SyncStatus> = await this.setupSync(url, startSequence, filter, auth);
        this.syncStatusSubscription = syncStatusObserver.subscribe(
            status => this.setStatus(status),
            err => {
                const syncStatus = SyncService.getStatusFromError(err);
                if (syncStatus !== SyncStatus.AuthenticationError && syncStatus !== SyncStatus.AuthorizationError) {
                    console.error(
                        'Synchronization error',
                        SyncService.getSanitizedErrorMessage(err, [this.password])
                    );
                }
                this.cancelSync();
                this.setStatus(syncStatus);
                this.currentSyncTimeout = setTimeout(() => this.startSync(startSequence, false), 5000); // retry
            }
        );

        return true;
    }


    public stopSync() {

        this.cancelSync();
        this.setStatus(SyncStatus.Offline);
    }


    public setStatus(status: SyncStatus) {

        this.status = status;
        ObserverUtil.notify(this.statusObservers, this.status);
    }


    private async setupSync(url: string, remoteStartSequence?: string|number,
                  filter?: (doc: any) => boolean, auth?: SyncAuth): Promise<Observable<SyncStatus>> {

        console.log('Start syncing', SyncService.redactCredentialsFromUrl(url));

        const options: any = {
            live: true,
            retry: false,
            batch_size: 50,
            batches_limit: 1,
            timeout: 600000,
            filter
        };
        if (auth) options.auth = auth;

        if (remoteStartSequence) {
            const localStartSequence: string|number = (await this.pouchdbDatastore.getDb().info()).update_seq;
            options.pull = {
                since: remoteStartSequence
            };
            options.push = {
                since: localStartSequence
            }
        }

        this.sync = this.pouchdbDatastore.getDb().sync(url, options);

        return Observable.create((obs: Observer<SyncStatus>) => {
            this.sync.on('change', (info: any) => obs.next(SyncService.getStatusFromInfo(info)))
                .on('paused', () => obs.next(SyncStatus.InSync))
                .on('active', () => obs.next(SyncStatus.Pulling))
                .on('complete', (info: any) => {
                    obs.next(SyncStatus.Offline);
                    obs.complete();
                })
                .on('error', (err: any) => obs.error(err));
        });
    }


    private cancelSync() {

        if (this.currentSyncTimeout) clearTimeout(this.currentSyncTimeout);
        if (this.sync) this.sync.cancel();
        if (this.syncStatusSubscription) this.syncStatusSubscription.unsubscribe();
        
        this.currentSyncTimeout = null;
        this.sync = null;
        this.syncStatusSubscription = null;
    }


    public static generateUrl(syncTarget: string, project: string, _password?: string) {

        if (syncTarget.indexOf('http') == -1) syncTarget = 'http://' + syncTarget;
        syncTarget = SyncService.normalizeSyncTarget(syncTarget, project);

        return syncTarget + '/db/' + project;
    }


    private static normalizeSyncTarget(syncTarget: string, project: string): string {

        let normalizedTarget = syncTarget.trim().replace(/\/+$/, '');
        const suffixes = [
            '/db/' + project,
            '/db'
        ];
        const matchedSuffix = suffixes.find(suffix => normalizedTarget.endsWith(suffix));

        if (matchedSuffix) normalizedTarget = normalizedTarget.slice(0, -matchedSuffix.length);

        return normalizedTarget.replace(/\/+$/, '');
    }


    public static generateAuth(project: string, password?: string): SyncAuth|undefined {

        return password
            ? { username: project, password }
            : undefined;
    }


    public static redactCredentialsFromUrl(url: string): string {

        return url.replace(/(https?:\/\/[^:/@]+):([^@]+)@/, '$1:*****@');
    }


    public static getSanitizedErrorMessage(error: any, secrets: string[] = []): string {

        const parts: string[] = [];

        if (error instanceof Error) {
            parts.push(error.message);
        } else if (typeof error === 'string') {
            parts.push(error);
        } else if (typeof error?.message === 'string') {
            parts.push(error.message);
        }

        if (error?.status) parts.push(`status ${error.status}`);
        if (error?.code) parts.push(`code ${error.code}`);

        return SyncService.redactSensitiveLogText(
            parts.length > 0 ? parts.join(' ') : 'Unknown synchronization error',
            secrets
        );
    }


    private static redactSensitiveLogText(value: string, secrets: string[] = []): string {

        let result = value
            .replace(/Basic\s+[A-Za-z0-9+/=._~-]+/gi, 'Basic [redacted]')
            .replace(/(Authorization["']?\s*[:=]\s*["']?)[^"',\s}]+/gi, '$1[redacted]')
            .replace(/(password["']?\s*[:=]\s*["']?)[^"',\s}]+/gi, '$1[redacted]');

        for (const secret of secrets) {
            if (secret) result = result.split(secret).join('[redacted]');
        }

        return result;
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
