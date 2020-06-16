import {Injectable} from '@angular/core';
import {set} from 'tsfun';
import {Settings} from './settings';
import {SettingsSerializer} from './settings-serializer';
import {PouchdbManager} from '../datastore/pouchdb/pouchdb-manager';
import {PouchdbServer} from '../datastore/pouchdb/pouchdb-server';
import {FieldSampleDataLoader} from '../datastore/field/field-sample-data-loader';
import {M} from '../../components/messages/m';
import {SyncService} from '../sync/sync-service';
import {Name} from '../constants';
import {AppConfigurator} from '../configuration/app-configurator';
import {ProjectConfiguration} from '../configuration/project-configuration';
import {Imagestore} from '../images/imagestore/imagestore';
import {ImageConverter} from '../images/imagestore/image-converter';
import {ImagestoreErrors} from '../images/imagestore/imagestore-errors';
import {Messages} from '../../components/messages/messages';
import {InitializationProgress} from '../initialization-progress';

const {remote, ipcRenderer} = typeof window !== 'undefined' ? window.require('electron') : require('electron');


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
 * @author Sebastian Cuy
 */
export class SettingsService {

    private settings: Settings;
    private settingsSerializer: SettingsSerializer = new SettingsSerializer();


    constructor(private imagestore: Imagestore,
                private pouchdbManager: PouchdbManager,
                private pouchdbServer: PouchdbServer,
                private messages: Messages,
                private appConfigurator: AppConfigurator,
                private imageConverter: ImageConverter,
                private synchronizationService: SyncService) {
    }


    /**
     * Retrieve the current settings.
     * Returns a clone of the settings object in order to prevent the settings
     * object from being changed without explicitly saving the settings.
     * @returns {Settings} the current settings
     */
    public getSettings = (): Settings => JSON.parse(JSON.stringify(this.settings)); // deep copy

    public getUsername = () => this.settings.username;

    public getDbs = () => this.settings.dbs;

    public getHostPassword = (): string => this.settings.hostPassword;


    public getSelectedProject(): string {

        return this.settings.dbs && this.settings.dbs.length > 0
            ? this.settings.dbs[0]
            : 'test';
    }

    public isAutoUpdateActive = () => this.settings.isAutoUpdateActive;


    public async bootProjectDb(settings: Settings, progress?: InitializationProgress): Promise<void> {

        try {
            await this.updateSettings(settings);

            if (progress) await progress.setPhase('settingUpDatabase');

            await this.pouchdbManager.loadProjectDb(
                this.getSelectedProject(),
                new FieldSampleDataLoader(
                    this.imageConverter, this.settings.imagestorePath, this.settings.locale, progress
                )
            );

            if (this.settings.isSyncActive) await this.setupSync();
            await this.createProjectDocumentIfMissing();
        } catch (msgWithParams) {
            console.error(msgWithParams);
            progress.setError('databaseError');
            throw msgWithParams;
        }
    }


    public async loadConfiguration(configurationDirPath: string,
                                   progress?: InitializationProgress): Promise<ProjectConfiguration> {

        if (progress) await progress.setPhase('loadingConfiguration');

        let customProjectName = undefined;
        if (this.getSelectedProject().startsWith('meninx-project')) customProjectName = 'Meninx';
        if (this.getSelectedProject().startsWith('pergamongrabung')) customProjectName = 'Pergamon';
        if (this.getSelectedProject() === 'wes' || this.getSelectedProject().startsWith('wes-')) {
            customProjectName = 'WES';
        }
        if (this.getSelectedProject().startsWith('bogazkoy-hattusa')) customProjectName = 'Boha';
        if (this.getSelectedProject().startsWith('campidoglio')) customProjectName = 'Campidoglio';
        if (this.getSelectedProject().startsWith('castiglione')) customProjectName = 'Castiglione';
        if (this.getSelectedProject().startsWith('kephissostal')) customProjectName = 'Kephissostal';
        if (this.getSelectedProject().startsWith('monte-turcisi')) customProjectName = 'MonTur';
        if (this.getSelectedProject().startsWith('al-ula')) customProjectName = 'AlUla';
        if (this.getSelectedProject().startsWith('kalapodi')) customProjectName = 'Kalapodi';
        if (this.getSelectedProject().startsWith('gadara_bm')) customProjectName = 'Gadara';
        if (this.getSelectedProject().startsWith('sudan-heritage')) customProjectName = 'SudanHeritage';
        if (this.getSelectedProject().startsWith('ayamonte')) customProjectName = 'Ayamonte';
        if (this.getSelectedProject().startsWith('abbircella')) customProjectName = 'AbbirCella';
        if (this.getSelectedProject().startsWith('karthagocircus')) customProjectName = 'KarthagoCircus';
        if (this.getSelectedProject().startsWith('selinunt')) customProjectName = 'Selinunt';

        try {
            return await this.appConfigurator.go(
                configurationDirPath,
                customProjectName,
                this.getSettings().locale
            );
        } catch (msgsWithParams) {
            if (msgsWithParams.length > 0) {
                msgsWithParams.forEach((msg: any) => console.error('err in project configuration', msg));
            } else { // should not happen normally
                console.error(msgsWithParams);
            }
            if (msgsWithParams.length > 1) {
                console.error('num errors in project configuration', msgsWithParams.length);
            }
            progress.setError('configurationError');
            await this.selectProject('test');
            throw 'Could not boot project';
        }
    }

    public async setupSync() {

        this.synchronizationService.stopSync();

        if (!this.settings.isSyncActive
                || !this.settings.dbs
                || !(this.settings.dbs.length > 0))
            return;

        if (!SettingsService.isSynchronizationAllowed(this.getSelectedProject())) return;

        this.synchronizationService.setSyncTarget(this.settings.syncTarget.address);
        this.synchronizationService.setProject(this.getSelectedProject());
        this.synchronizationService.setPassword(this.settings.syncTarget.password);
        return this.synchronizationService.startSync();
    }


    public async addProject(project: Name) {

        this.settings.dbs = set(this.settings.dbs.concat([project]));
        await this.settingsSerializer.store(this.settings);
    }


    public async selectProject(project: Name) {

        this.synchronizationService.stopSync();

        this.settings.dbs = set([project].concat(this.settings.dbs));
        await this.settingsSerializer.store(this.settings);
    }


    public async deleteProject(project: Name) {

        this.synchronizationService.stopSync();

        await this.pouchdbManager.destroyDb(project);
        this.settings.dbs.splice(this.settings.dbs.indexOf(project), 1);
        await this.settingsSerializer.store(this.settings);
    }


    public async createProject(project: Name, destroyBeforeCreate: boolean) {

        this.synchronizationService.stopSync();

        await this.selectProject(project);

        await this.pouchdbManager.createDb(
            project,
            SettingsService.createProjectDocument(project, this.getUsername()),
            destroyBeforeCreate
        );
    }


    /**
     * Sets, validates and persists the settings state.
     * Project settings have to be set separately.
     */
    public async updateSettings(settings: Settings) {

        settings = JSON.parse(JSON.stringify(settings)); // deep copy
        this.settings = SettingsService.initSettings(settings);

        if (this.settings.syncTarget.address) {
            this.settings.syncTarget.address = this.settings.syncTarget.address.trim();
            if (!SettingsService.validateAddress(this.settings.syncTarget.address))
                throw 'malformed_address';
        }

        if (ipcRenderer) ipcRenderer.send('settingsChanged', this.settings);

        this.pouchdbServer.setPassword(this.settings.hostPassword);

        return this.imagestore.setPath(settings.imagestorePath, this.getSelectedProject() as any)
            .catch((errWithParams: any) => {
                if (errWithParams.length > 0 && errWithParams[0] === ImagestoreErrors.INVALID_PATH) {
                    this.messages.add([M.IMAGESTORE_ERROR_INVALID_PATH, settings.imagestorePath]);
                } else {
                    console.error('Something went wrong with imagestore.setPath', errWithParams);
                }
            })
            .then(() => this.settingsSerializer.store(this.settings));
    }


    private async createProjectDocumentIfMissing() {

        try {
            await this.pouchdbManager.getDbProxy().get('project');
        } catch (_) {
            console.warn('Didn\'t find project document, creating new one');
            await this.pouchdbManager.getDbProxy().put(
                SettingsService.createProjectDocument(this.getSelectedProject(), this.getUsername())
            );
        }
    }


    private static isSynchronizationAllowed(project: string): boolean {

        return project !== undefined && (project !== 'test' || remote.getGlobal('mode') === 'test');
    }


    private static validateAddress(address: any) {

        return (address == '')
            ? true
            : new RegExp('^(https?:\/\/)?([0-9a-z\.-]+)(:[0-9]+)?(\/.*)?$').test(address);
    }


    /**
     * initializes settings to default values
     * @param settings provided settings
     * @returns {Settings} settings with added default settings
     */
    private static initSettings(settings: Settings): Settings {

        if (!settings.username) settings.username = 'anonymous';
        if (!settings.dbs || settings.dbs.length === 0) settings.dbs = ['test'];
        if (!settings.isSyncActive) settings.isSyncActive = false;
        if (settings.hostPassword === undefined) settings.hostPassword = this.generatePassword();

        if (settings.imagestorePath) {
            let path: string = settings.imagestorePath;
            if (path.substr(-1) != '/') path += '/';
            settings.imagestorePath = path;
        } else {
            if (remote.app){ // jasmine unit tests
                settings.imagestorePath = remote.app.getPath('appData') + '/'
                    + remote.app.getName() + '/imagestore/';
            }
        }
        return settings;
    }


    private static createProjectDocument(name: string, username: string): any {

        return {
            _id: 'project',
            resource: {
                category: 'Project',
                identifier: name,
                id: 'project',
                coordinateReferenceSystem: 'Eigenes Koordinatenbezugssystem',
                relations: {}
            },
            created: { user: username, date: new Date() },
            modified: [{ user: username, date: new Date() }]
        };
    }


    private static generatePassword(): string {
        const length = 8,
            charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let retVal = "";
        for (var i = 0, n = charset.length; i < length; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n));
        }
        return retVal;
    }
}
