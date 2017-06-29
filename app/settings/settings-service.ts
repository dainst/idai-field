import {Injectable} from "@angular/core";
import {IdaiFieldDatastore} from "../datastore/idai-field-datastore";
import {Settings, SyncTarget} from "./settings";
import {SettingsSerializer} from "./settings-serializer";
import {Imagestore} from "../imagestore/imagestore";
import {Observable} from "rxjs/Rx";
import {PouchdbManager} from "../datastore/pouchdb-manager";


@Injectable()
/**
 * The settings service provides access to the
 * properties of the config.json file. It can be
 * serialized to and from config.json files.
 *
 * It is connected to the imagestore and datastore
 * subsystems which are controlled based on the settings.
 *
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
                private imagestore: Imagestore,
                private pouchdbManager: PouchdbManager) {
    }

    public init() {
        this.ready = this.settingsSerializer.load().then((settings) => {
            this.settings = settings;
            if (this.settings.dbs && this.settings.dbs.length > 0) {

                const project = this.getSelectedProject();

                // if project object does not exist, create it
                this.datastore.get(project).catch(()=>{
                    this.datastore.create({
                        "resource" : {
                            "type" : "project",
                            "identifier" : project,
                            "id" : project,
                            relations: {}
                        }
                    })
                });

                this.pouchdbManager.select(project);
                this.imagestore.select(project);
                this.setSettings(
                    project,
                    this.settings.dbs,
                    this.settings.username,
                    this.settings.syncTarget);
                return this.activateSettings();
            }
        })
    }

    public getSyncTarget() {
        return JSON.parse(JSON.stringify(this.settings.syncTarget));
    }

    public getUsername() {
        return this.settings.username ? JSON.parse(JSON.stringify(this.settings.username)) : 'anonymous';
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

    /**
     * Sets, validates and persists the settings state.
     *
     * @param projectName
     * @param username
     * @param syncTarget
     * @return error encoding string
     *   'malformed_address'
     */
    public setSettings (
        projectName: string,
        projects: string[],
        username: string,
        syncTarget: SyncTarget): string {

        this.settings.username = username;
        this.settings.dbs = projects.slice(0); // copy

        if (syncTarget.address) {
            syncTarget.address = syncTarget.address.trim();
            if (!SettingsService.validateAddress(syncTarget.address)) return 'malformed_address';
        }

        this.settings.syncTarget = syncTarget;
        this.makeFirstOfDbsArray(projectName);
        this.storeSettings();

        return undefined;
    }

    /**
     * Activates the current settings state set by {@link #setSettings}
     * by triggering (re-)start of syncing of the corresponding db
     * and selecting the imagestore.
     *
     * @param restart
     * @returns {any}
     */
    public activateSettings(restart = false): Promise<any> {
        this.imagestore.select(this.getSelectedProject());
        if (restart) {
            return this.restartSync();
        } else {
            return this.startSync();
        }
    }

    private startSync(): Promise<any> {

        let address = SettingsService.makeAddressFromSyncTarget(this.settings.syncTarget);
        if (!address) return Promise.resolve();

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
                }
            );

    }

    private restartSync() {
        if (!this.settings.dbs || !(this.settings.dbs.length > 0)) return;

        this.pouchdbManager.select(this.settings.dbs[0]);
        return new Promise<any>((resolve) => {
            this.observers.forEach(o => o.next(false));
            this.datastore.stopSync();
            setTimeout(() => {
                this.startSync().then(() => resolve());
            }, 1000);
        })
    }

    private static validateAddress(address) {

        if (address == '') return true;

        const re = new RegExp("^http:\/\/[0-9a-z.]+:[0-9]+$");
        return re.test(address);
    }

    private makeFirstOfDbsArray(projectName: string) {

        const index = this.settings.dbs.indexOf(projectName);
        if (index != -1) {
            this.settings.dbs.splice(index, 1);
            this.settings.dbs.unshift(projectName);
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

    private static makeAddressFromSyncTarget(serverSetting) {

        let address = serverSetting['address'];

        if (!address || !serverSetting['username'] || !serverSetting['password']) return address;

        return address.replace('http://', 'http://' +
            serverSetting['username'] + ':' + serverSetting['password'] + '@');
    }

    private storeSettings(): Promise<any> {
        return this.settingsSerializer.store(this.settings);
    }

    private serverSettingsComplete(): boolean {

        return (this.settings.syncTarget.username && this.settings.syncTarget.username.length > 0 &&
        this.settings.syncTarget.password && this.settings.syncTarget.password.length > 0 &&
        this.settings.syncTarget.address && this.settings.syncTarget.address.length > 0);
    }
}