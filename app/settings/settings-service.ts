import {Injectable} from "@angular/core";
import {IdaiFieldDatastore} from "../datastore/idai-field-datastore";
import {Settings} from "./settings";
import {SettingsSerializer} from "./settings-serializer";
import {FileSystemImagestore} from "../imagestore/file-system-imagestore";
import {Observable} from "rxjs/Rx";


@Injectable()
/**
 * The settings service provides access to the
 * properties of the config.json file. It can be
 * serialized to and from config.json files.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class SettingsService {

    private observers = [];
    private settings: Settings;
    private settingsSerializer: SettingsSerializer = new SettingsSerializer();

    public ready: Promise<any>;

    constructor(private datastore: IdaiFieldDatastore,
                private fileSystemImagestore: FileSystemImagestore) {
        fileSystemImagestore.select('test');
    }

    public init() {
        this.ready = this.settingsSerializer.load().then((settings) => {
            this.settings = settings;

            if (this.settings.dbs && this.settings.dbs.length > 0) {
                this.datastore.select(this.settings.dbs[0]);
                this.selectProject(this.settings.dbs[0]);
            }
        })
    }

    public restartSync() {
        if (!this.settings.dbs || !(this.settings.dbs.length > 0)) return;

        this.datastore.select(this.settings.dbs[0]);
        return new Promise<any>((resolve) => {
            this.observers.forEach(o => o.next(false));
            this.datastore.stopSync();
            setTimeout(() => {
                this.startSync().then(() => resolve());
            }, 1000);
        })
    }

    public setServer(server) {
        this.settings.server = server;
    }

    public getServer() {
        return JSON.parse(JSON.stringify(this.settings.server));
    }

    public setUserName(userName) {
        this.settings.userName = userName;
    }

    public getUserName() {
        return this.settings.userName ? JSON.parse(JSON.stringify(this.settings.userName)) : 'anonymous';
    }

    public getProjects() {
        return this.settings.dbs;
    }

    public getSelectedProject() {
        if (!this.settings.dbs || this.settings.dbs.length == 0) {
            return undefined;
        } else {
            return this.settings.dbs[0];
        }
    }

    public selectProject(name, restart = false) {
        const index = this.settings.dbs.indexOf(name);
        if (index != -1) {
            this.settings.dbs.splice(index, 1);
            this.settings.dbs.unshift(name);
        }
        this.fileSystemImagestore.select(name);
        this.storeSettings();

        if (restart) {
            return this.restartSync();
        } else {
            return this.startSync();
        }
    }

    /**
     * Observe synchronization status changes. The following states can be
     * subscribed to:
     * * 'connected': The connection to the server has been established
     * * 'disconnected': The connection to the server has been lost
     * * 'changed': A changed document has been transmitted
     * @returns Observable<string>
     */
    public syncStatusChanges(): Observable<string> {

        return Observable.create(observer => {
            this.observers.push(observer);
        });
    }

    private startSync(): Promise<any> {

        let address = this.convert(this.settings.server);
        if (!address) {
            return Promise.resolve();
        } else {
            return this.datastore.setupSync(address)
                .then(syncState => {
                    const msg = setTimeout(() => this.observers.forEach(o => o.next('connected')), 500); // avoid issuing 'connected' too early
                    syncState.onError.subscribe(() => {
                        clearTimeout(msg); // stop 'connected' msg if error
                        syncState.cancel();
                        this.observers.forEach(o => o.next('disconnected'));
                        setTimeout(() => this.startSync(), 5000); // retry
                    });
                    syncState.onChange.subscribe(() => this.observers.forEach(o => o.next('changed')));
                });
        }
    }

    private convert(serverSetting) {

        let converted = serverSetting['ipAddress'];

        if (!converted) return false;

        converted = converted.replace('http://', 'http://' +
            serverSetting['userName'] + ':' + serverSetting['password'] + '@');

        return converted;
    }

    private storeSettings(): Promise<any> {
        return this.settingsSerializer.store(this.settings);
    }

    private serverSettingsComplete(): boolean {

        return (this.settings.server['userName'] && this.settings.server['userName'].length > 0 &&
        this.settings.server['password'] && this.settings.server['password'].length > 0 &&
        this.settings.server['ipAddress'] && this.settings.server['ipAddress'].length > 0);
    }
}