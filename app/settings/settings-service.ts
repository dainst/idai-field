import {Injectable} from '@angular/core';
import {Settings, SyncTarget} from './settings';
import {SettingsSerializer} from './settings-serializer';
import {Imagestore} from '../imagestore/imagestore';
import {Observable} from 'rxjs/Rx';
import {PouchdbManager} from '../datastore/pouchdb-manager';
import {AppState} from '../app-state';

const app = require('electron').remote.app;

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

    private syncStatucObservers = [];
    private settings: Settings;
    private settingsSerializer: SettingsSerializer = new SettingsSerializer();
    private currentSyncUrl = '';
    private currentSyncTimeout;

    public ready: Promise<any>;

    constructor(private imagestore: Imagestore,
                private pouchdbManager: PouchdbManager,
                private appState: AppState) {
    }

    public init() {

        this.ready = this.settingsSerializer.load().then(settings => {
            this.settings = settings;
            if (this.settings.dbs && this.settings.dbs.length > 0) {
                this.pouchdbManager.setProject(this.getSelectedProject());

                return this.setProjectSettings(this.settings.dbs, this.getSelectedProject(), false)
                    .then(() => this.setSettings(this.settings.username, this.settings.syncTarget,
                        this.settings.imagestorePath))
                    .then(() => this.startSync());
            }
        })
    }

    public getSyncTarget() {

        return JSON.parse(JSON.stringify(this.settings.syncTarget));
    }

    public getUsername(): string {

        return this.settings.username ? JSON.parse(JSON.stringify(this.settings.username)) : 'anonymous';
    }

    public getProjects(): string[] {

        return this.settings.dbs;
    }

    public getSelectedProject(): string {
        
        if (this.settings.dbs && this.settings.dbs.length > 0) return this.settings.dbs[0];
    }

    public getImagestorePath(): string {

        if (this.settings.imagestorePath) {
            let path: string = this.settings.imagestorePath;
            if (path.substr(-1) != '/') path += '/';
            return path;
        } else {
            return app.getPath('appData') + '/' + app.getName() + '/imagestore/';
        }
    }

    /**
     * Sets, validates and persists the settings state.
     * Project settings have to be set separately.
     *
     * @param username
     * @param syncTarget
     * @return error encoding string
     *   'malformed_address'
     */
    public setSettings(username: string, syncTarget: SyncTarget, imagestorePath: string): string {

        this.settings.username = username;
        this.appState.setCurrentUser(username);

        this.settings.imagestorePath = imagestorePath;
        this.appState.setImagestorePath(this.getImagestorePath());
        this.imagestore.setPath(this.getImagestorePath(), this.getSelectedProject());

        if (syncTarget.address) {
            syncTarget.address = syncTarget.address.trim();
            if (!SettingsService.validateAddress(syncTarget.address)) return 'malformed_address';
        }
        this.settings.syncTarget = syncTarget;

        this.storeSettings();
    }

    /**
     * Sets project settings
     *
     * @param projects
     * @param selectedProject
     * @param storeSettings if set to false, settings get not persisted
     * @param create
     * @returns {any}
     */
    public setProjectSettings(projects: string[], selectedProject: string,
                              storeSettings: boolean = true, create: boolean = false): Promise<any> {

        this.settings.dbs = projects.slice(0);
        this.makeFirstOfDbsArray(selectedProject);

        let p: Promise<any> = Promise.resolve();
        if (storeSettings) {
            p = p.then(() => this.storeSettings());
        }

        if (create) {
            p = p.then(() => {
                return this.pouchdbManager.createDb(
                    selectedProject, this.makeProjectDoc(selectedProject));
            });
        }

        return p;
    }

    public deleteProject(name: string) {

        return this.pouchdbManager.destroyDb(name);
    }

    private startSync(): Promise<any> {

        if (this.currentSyncTimeout) clearTimeout(this.currentSyncTimeout);

        this.currentSyncUrl = SettingsService.makeUrlFromSyncTarget(this.settings.syncTarget);
        if (!this.currentSyncUrl) return Promise.resolve();

        return this.pouchdbManager.setupSync(this.currentSyncUrl).then(syncState => {

            // avoid issuing 'connected' too early
            const msg = setTimeout(() => this.syncStatucObservers.forEach(o => o.next('connected')), 500);

            syncState.onError.subscribe(() => {
                clearTimeout(msg); // stop 'connected' msg if error
                syncState.cancel();
                this.syncStatucObservers.forEach(o => o.next('disconnected'));
                this.currentSyncTimeout = setTimeout(() => this.startSync(), 5000); // retry
            });
            syncState.onChange.subscribe(() => this.syncStatucObservers.forEach(o => o.next('changed')));
        });
    }

    public restartSync() {

        if (!this.settings.dbs || !(this.settings.dbs.length > 0)) return;

        return new Promise<any>((resolve) => {
                this.syncStatucObservers.forEach(o => o.next(false));
                setTimeout(() => {
                    this.startSync().then(() => resolve());
                }, 1000);
            });
    }

    private makeProjectDoc(name: string) {

        return {
            _id: name,
            resource: {
                type: 'Project',
                identifier: name,
                id: name,
                coordinateReferenceSystem: 'Eigenes Koordinatenbezugssystem',
                relations: {}
            },
            created: { user: this.getUsername(), date: new Date() },
            modified: [{ user: this.getUsername(), date: new Date() }]
        };
    }

    private static validateAddress(address) {

        if (address == '') return true;

        const re = new RegExp('^(https?:\/\/)?([0-9a-z\.-]+)(:[0-9]+)?(\/.*)?$');
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
            this.syncStatucObservers.push(observer);
        });
    }

    private static makeUrlFromSyncTarget(serverSetting) {

        let address = serverSetting['address'];

        if (!address) return address;

        if (address.indexOf('http') == -1) address = 'http://' + address;

        if (!serverSetting['username'] || !serverSetting['password']) return address;

        return address.replace(/(https?):\/\//, '$1://' +
            serverSetting['username'] + ':' + serverSetting['password'] + '@');
    }

    private storeSettings(): Promise<any> {

        return this.settingsSerializer.store(this.settings);
    }
}