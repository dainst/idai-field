import {Injectable} from '@angular/core';
import {Messages} from 'idai-components-2/messages';
import {Settings} from './settings';
import {SettingsSerializer} from './settings-serializer';
import {Imagestore} from '../imagestore/imagestore';
import {Observable} from 'rxjs/Rx';
import {PouchdbManager} from '../datastore/pouchdb-manager';
import {AppState} from './app-state';
import {ImagestoreErrors} from '../imagestore/imagestore-errors';
import {M} from '../../m';
import {Observer} from 'rxjs/Observer';

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


    private syncStatusObservers = [];
    private settings: Settings;
    private settingsSerializer: SettingsSerializer = new SettingsSerializer();
    private currentSyncUrl = '';
    private currentSyncTimeout: any;

    public ready: Promise<any>;


    constructor(private imagestore: Imagestore,
                private pouchdbManager: PouchdbManager,
                private appState: AppState,
                private messages: Messages) {
    }


    public init() {

        this.ready = this.settingsSerializer.load()
            .then(settings => this.updateSettings(settings))
            .then(() => this.pouchdbManager.setProject(this.getSelectedProject() as any))
            .then(() => this.setProjectSettings(this.settings.dbs, this.getSelectedProject() as any, false))
            .then(() => {
                if (this.settings.isSyncActive)
                    return this.startSync();
            });

        return this.ready;
    }


    public getSelectedProject(): string|undefined {
        
        if (this.settings.dbs && this.settings.dbs.length > 0) return this.settings.dbs[0];
    }


    public getUsername(): string {

        return this.settings.username;
    }


    /**
     * Sets, validates and persists the settings state.
     * Project settings have to be set separately.
     *
     * @param settings
     * @return Promise encoding string
     *   'malformed_address'
     */
    public updateSettings(settings: Settings): Promise<any> {

        settings = JSON.parse(JSON.stringify(settings)); // deep copy
        this.settings = SettingsService.initSettings(settings);

        if (this.settings.syncTarget.address) {
            this.settings.syncTarget.address = this.settings.syncTarget.address.trim();
            if (!SettingsService.validateAddress(this.settings.syncTarget.address))
                Promise.reject('malformed_address');
        }

        this.appState.setCurrentUser(settings.username);
        this.appState.setImagestorePath(settings.imagestorePath);

        return this.imagestore.setPath(settings.imagestorePath, this.getSelectedProject() as any)
            .catch((errWithParams: any) => {
                if (errWithParams.length > 0 && errWithParams[0] == ImagestoreErrors.INVALID_PATH) {
                    this.messages.add([M.IMAGESTORE_ERROR_INVALID_PATH, settings.imagestorePath]);
                } else {
                    console.error("something went wrong with imagestore.setPath",errWithParams);
                }
            })
            .then(() => this.storeSettings());
    }

    /**
     * Retrieve the current settings.
     * Returns a clone of the settings object in order to prevent the settings
     * object from being changed without explicitly saving the settings.
     * @returns {Settings} the current settings
     */
    public getSettings(): Settings {

        return JSON.parse(JSON.stringify(this.settings)); // deep copy
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

    public startSync(): Promise<any> {

        if (this.currentSyncTimeout) clearTimeout(this.currentSyncTimeout);

        this.currentSyncUrl = SettingsService.makeUrlFromSyncTarget(this.settings.syncTarget);
        if (!this.currentSyncUrl) return Promise.resolve();

        console.log('SettingsService.startSync()');

        return this.pouchdbManager.setupSync(this.currentSyncUrl).then(syncState => {

            // avoid issuing 'connected' too early
            const msg = setTimeout(() => this.syncStatusObservers.forEach((o: Observer<any>) => o.next('connected')), 500);

            syncState.onError.subscribe(() => {
                clearTimeout(msg); // stop 'connected' msg if error
                syncState.cancel();
                this.syncStatusObservers.forEach((o: Observer<any>) => o.next('disconnected'));
                this.currentSyncTimeout = setTimeout(() => this.startSync(), 5000); // retry
            });
            syncState.onChange.subscribe(() => this.syncStatusObservers.forEach((o: Observer<any>) => o.next('changed')));
        });
    }

    public restartSync() {

        this.stopSync();

        if (!this.settings.isSyncActive
                || !this.settings.dbs
                || !(this.settings.dbs.length > 0))
            return Promise.resolve();

        return new Promise<any>((resolve) => {
                setTimeout(() => {
                    this.startSync().then(() => resolve());
                }, 1000);
            });
    }

    private stopSync() {

        if (this.currentSyncTimeout) clearTimeout(this.currentSyncTimeout);
        this.pouchdbManager.stopSync();
        this.syncStatusObservers.forEach((o: Observer<any>) => o.next('disconnected'));
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
            created: { user: this.settings.username, date: new Date() },
            modified: [{ user: this.settings.username, date: new Date() }]
        };
    }

    private static validateAddress(address: any) {

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

        return Observable.create((o: Observer<any>) => {
            this.syncStatusObservers.push(o as never);
        });
    }

    private static makeUrlFromSyncTarget(serverSetting: any) {

        let address = serverSetting['address'];

        if (!address) return false;

        if (address.indexOf('http') == -1) address = 'http://' + address;

        if (!serverSetting['username'] || !serverSetting['password']) return address;

        return address.replace(/(https?):\/\//, '$1://' +
            serverSetting['username'] + ':' + serverSetting['password'] + '@');
    }

    private storeSettings(): Promise<any> {

        return this.settingsSerializer.store(this.settings);
    }

    /**
     * initializes settings to default values
     * @param settings provided settings
     * @returns {Settings} settings with added default settings
     */
    private static initSettings(settings: Settings): Settings {

        if (!settings.username) settings.username = 'anonymous';

        if (!settings.dbs || settings.dbs.length == 0) settings.dbs = ['test'];

        if (!settings.isSyncActive) settings.isSyncActive = false;

        if (settings.imagestorePath) {
            let path: string = settings.imagestorePath;
            if (path.substr(-1) != '/') path += '/';
            settings.imagestorePath = path;
        } else {
            settings.imagestorePath = app.getPath('appData') + '/'
                + app.getName() + '/imagestore/';
        }
        return settings;
    }
}