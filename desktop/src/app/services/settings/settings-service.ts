import { Injectable } from '@angular/core';
import { AppConfigurator, getConfigurationName, Name, PouchdbDatastore, ProjectConfiguration, SyncService, Imagestore } from 'idai-field-core';
import { isString } from 'tsfun';
import { M } from '../../components/messages/m';
import { Messages } from '../../components/messages/messages';
import { PouchdbServer } from '../datastore/pouchdb/pouchdb-server';
import { ImagestoreErrors } from '../imagestore/imagestore-errors';
import { Settings, SyncTarget } from './settings';
import { SettingsProvider } from './settings-provider';

const ipcRenderer = typeof window !== 'undefined' ? window.require('electron').ipcRenderer : require('electron').ipcRenderer;
const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;


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

    constructor(private imagestore: Imagestore,
                private pouchdbDatastore: PouchdbDatastore,
                private pouchdbServer: PouchdbServer,
                private messages: Messages,
                private appConfigurator: AppConfigurator,
                private synchronizationService: SyncService,
                private settingsProvider: SettingsProvider) {
    }


    public async bootProjectDb(selectedProject: string,
                               destroyBeforeCreate: boolean = false): Promise<void> {

        try {
            await this.pouchdbDatastore.createDb(
                selectedProject,
                SettingsService.createProjectDocument(this.settingsProvider.getSettings()),
                destroyBeforeCreate
            );
            this.pouchdbDatastore.setupChangesEmitter();
        } catch (msgWithParams) {
            console.error(msgWithParams);
            throw msgWithParams;
        }
    }


    /**
     * Sets, validates and persists the settings state.
     * Project settings have to be set separately.
     */
    public async updateSettings(settings_: Settings): Promise<Settings> {

        this.settingsProvider.setSettings(settings_);
        const settings = this.settingsProvider.getSettings();

        Object.values(settings.syncTargets).forEach(syncTarget => {
            if (syncTarget.address) {
                syncTarget.address = syncTarget.address.trim();
                if (!SettingsService.validateAddress(syncTarget.address)) {
                    throw 'malformed_address';
                }
            }
        });

        if (ipcRenderer) ipcRenderer.send('settingsChanged', settings);

        this.imagestore.init(settings.imagestorePath + settings.selectedProject);

        this.pouchdbServer.setPassword(settings.hostPassword);

        return this.settingsProvider.setSettingsAndSerialize(settings).then(() => settings);
    }


    public async loadConfiguration(): Promise<ProjectConfiguration> {

        try {
            return this.appConfigurator.go(
                this.settingsProvider.getSettings().username,
                getConfigurationName(this.settingsProvider.getSettings().selectedProject)
            );
        } catch (msgsWithParams) {
            if (isString(msgsWithParams)) {
                msgsWithParams = [[msgsWithParams]];
            } else if (msgsWithParams.length > 0 && isString(msgsWithParams[0])) {
                msgsWithParams = [msgsWithParams];
            }

            msgsWithParams.forEach((msg: any) => console.error('Error in project configuration', msg));
            if (msgsWithParams.length > 1) {
                console.error('Number of errors in project configuration:', msgsWithParams.length);
            }

            throw msgsWithParams;
        }
    }

    public async setupSync() {

        this.synchronizationService.stopSync();

        const settings = this.settingsProvider.getSettings();

        const syncTarget: SyncTarget|undefined = settings.syncTargets[settings.selectedProject];

        if (!syncTarget?.isSyncActive || !settings.dbs || !(settings.dbs.length > 0)) return;
        if (!SettingsService.isSynchronizationAllowed(settings.selectedProject)) return;

        this.synchronizationService.init(
            syncTarget?.address,
            settings.selectedProject,
            syncTarget?.password
        );

        return this.synchronizationService.startSync();
    }


    public async addProject(project: Name, syncTarget?: SyncTarget) {

        if (!syncTarget) {
            await this.settingsProvider.addProjectAndSerialize(project);
            return;
        } else {
            const settings = this.settingsProvider.getSettings();
            settings.syncTargets[project] = syncTarget;
            settings.dbs = [project].concat(settings.dbs);
            await this.settingsProvider.setSettingsAndSerialize(settings);
        }
    }


    public async selectProject(project: Name) {

        this.synchronizationService.stopSync();
        await this.settingsProvider.selectProjectAndSerialize(project);
    }


    public async deleteProject(project: Name) {

        this.synchronizationService.stopSync();

        await this.pouchdbDatastore.destroyDb(project);
        await this.settingsProvider.deleteProjectAndSerialize(project);
    }


    public async createProject(project: Name, destroyBeforeCreate: boolean) {

        this.synchronizationService.stopSync();

        await this.selectProject(project);

        await this.pouchdbDatastore.createDb(
            project,
            SettingsService.createProjectDocument(this.settingsProvider.getSettings()),
            destroyBeforeCreate
        );
    }


    public static createProjectDocument(settings: Settings): any {

        return {
            _id: 'project',
            resource: {
                category: 'Project',
                identifier: settings.selectedProject,
                id: 'project',
                coordinateReferenceSystem: 'Eigenes Koordinatenbezugssystem',
                relations: {}
            },
            created: { user: settings.username, date: new Date() },
            modified: [{ user: settings.username, date: new Date() }]
        };
    }


    private static isSynchronizationAllowed(project: string): boolean {

        return project !== undefined && (project !== 'test' || (!remote || remote.getGlobal('mode') === 'test'));
    }


    private static validateAddress(address: any) {

        return (address == '')
            ? true
            : new RegExp('^(https?:\/\/)?([0-9a-z\.-]+)(:[0-9]+)?(\/.*)?$').test(address);
    }
}
