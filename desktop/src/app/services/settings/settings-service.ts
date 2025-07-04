import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { isString } from 'tsfun';
import { AppConfigurator, ConfigReader, ConfigurationDocument, getConfigurationName, ImageStore, ImageSyncService,
    Name, PouchdbDatastore, ProjectConfiguration, SyncService, Template, Document, I18N, validateUrl,
    ObserverUtil } from 'idai-field-core';
import { M } from '../../components/messages/m';
import { Messages } from '../../components/messages/messages';
import { ExpressServer } from '../express-server';
import { Settings } from './settings';
import { SyncTarget } from './sync-target';
import { SettingsProvider } from './settings-provider';
import { SettingsErrors } from './settings-errors';

const ipcRenderer = window.require('electron')?.ipcRenderer;
const remote = window.require('@electron/remote');
const PouchDB = window.require('pouchdb-browser');


type validationMode = 'settings'|'synchronization'|'none';


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

    private changesObservers: Array<Observer<void>> = [];


    constructor(private imagestore: ImageStore,
                private pouchdbDatastore: PouchdbDatastore,
                private expressServer: ExpressServer,
                private messages: Messages,
                private appConfigurator: AppConfigurator,
                private synchronizationService: SyncService,
                private imageSyncService: ImageSyncService,
                private settingsProvider: SettingsProvider,
                private configReader: ConfigReader) {}


    public changesNotifications = (): Observable<void> => ObserverUtil.register(this.changesObservers);


    public async bootProjectDb(selectedProject: string, projectDocument?: Document,
                               destroyBeforeCreate: boolean = false): Promise<void> {

        try {
            await this.pouchdbDatastore.createDb(
                selectedProject,
                projectDocument,
                null,
                destroyBeforeCreate
            );
            if (!await this.pouchdbDatastore.getDb().get('project')) {
                throw Error('Project document is missing');
            }
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
    public async updateSettings(newSettings: Settings, validate: validationMode = 'none'): Promise<Settings> {

        if (validate === 'settings' && !Settings.hasUsername(newSettings)) {
            throw SettingsErrors.MISSING_USERNAME;
        }

        this.settingsProvider.setSettings(newSettings);
        const settings: Settings = this.settingsProvider.getSettings();

        const syncTarget: SyncTarget = settings.syncTargets[settings.selectedProject];
        if (syncTarget?.address) {
            syncTarget.address = syncTarget.address.trim();
            if (validate === 'synchronization' && !SettingsService.validateAddress(syncTarget.address)) {
                throw SettingsErrors.MALFORMED_ADDRESS;
            }
        }
        if (syncTarget?.password) syncTarget.password = syncTarget.password.trim();

        if (ipcRenderer) ipcRenderer.send('settingsChanged', settings);

        try {
            await this.imagestore.init(settings.imagestorePath, settings.selectedProject);
        } catch (e) {
            this.messages.add([M.IMAGESTORE_ERROR_INVALID_PATH, settings.imagestorePath]);
        }

        this.expressServer.setPassword(settings.hostPassword);
        this.expressServer.setAllowLargeFileUploads(settings.allowLargeFileUploads);

        await this.settingsProvider.setSettingsAndSerialize(settings);

        ObserverUtil.notify(this.changesObservers, null);

        return settings;
    }


    public async loadConfiguration(): Promise<ProjectConfiguration> {

        const projectIdentifier: string = this.settingsProvider.getSettings().selectedProject;
        const configurationName: string = getConfigurationName(projectIdentifier);

        const configurationDocument: ConfigurationDocument = await ConfigurationDocument.getConfigurationDocument(
            (id: string) => this.pouchdbDatastore.getDb().get(id),
            this.configReader,
            projectIdentifier,
            this.settingsProvider.getSettings().username
        );

        try {
            return this.appConfigurator.go(configurationName, configurationDocument);
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

        this.imageSyncService.stopAllSyncing();
        this.synchronizationService.stopSync();

        const settings = this.settingsProvider.getSettings();

        const syncTarget: SyncTarget|undefined = settings.syncTargets[settings.selectedProject];

        if (!syncTarget?.isSyncActive || !settings.dbs || !(settings.dbs.length > 0)) return;
        if (!SettingsService.isSynchronizationAllowed(settings.selectedProject)) return;

        this.synchronizationService.init(
            SyncTarget.getAddress(syncTarget),
            settings.selectedProject,
            syncTarget?.password,
            SettingsService.checkDatabaseExistence
        );

        if (await this.synchronizationService.startSync()) {
            for (const preferences of syncTarget.fileSyncPreferences) {
                this.imageSyncService.startSync(preferences);
            }
        }
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

        this.imageSyncService.stopAllSyncing();
        this.synchronizationService.stopSync();
        await this.settingsProvider.selectProjectAndSerialize(project);
    }


    public async deleteProject(project: Name, deleteFiles: boolean = false) {

        this.imageSyncService.stopAllSyncing();
        this.synchronizationService.stopSync();

        if (deleteFiles) {
            try {
                await this.imagestore.deleteData(project);
            } catch (e) {
                console.error('Error while trying to delete image data:');
                console.error(e);
            }
        }

        await this.pouchdbDatastore.destroyDb(project);
        await this.settingsProvider.deleteProjectAndSerialize(project);
    }


    public async createProject(projectIdentifier: string, template: Template, selectedLanguages: string[],
                               projectName: I18N.String|undefined, destroyBeforeCreate: boolean) {

        this.imageSyncService.stopAllSyncing();
        this.synchronizationService.stopSync();

        await this.selectProject(projectIdentifier);

        const projectDocument: Document = SettingsService.createProjectDocument(
            this.settingsProvider.getSettings(), projectName
        );
        await this.updateProjectName(projectDocument);

        await this.pouchdbDatastore.createDb(
            projectIdentifier,
            projectDocument,
            SettingsService.createConfigurationDocument(this.settingsProvider.getSettings(), template, selectedLanguages),
            destroyBeforeCreate
        );
    }


    public async updateProjectName(projectDocument: Document): Promise<Settings> {

        const settings = this.settingsProvider.getSettings();
        if (!settings.projectNames) settings.projectNames = {};

        if (projectDocument.resource.shortName) {
            settings.projectNames[projectDocument.resource.identifier] = projectDocument.resource.shortName;
        } else {
            delete settings.projectNames[projectDocument.resource.identifier];
        }
        
        await this.settingsProvider.setSettingsAndSerialize(settings);

        return settings;
    }


    public static createProjectDocument(settings: Settings, projectName?: I18N.String): Document {

        const projectDocument: Document = {
            _id: 'project',
            resource: {
                id: 'project',
                category: 'Project',
                identifier: settings.selectedProject,
                coordinateReferenceSystem: 'Eigenes Koordinatenbezugssystem',
                relations: {}
            },
            created: { user: settings.username, date: new Date() },
            modified: [{ user: settings.username, date: new Date() }]
        };

        if (projectName) projectDocument.resource.shortName = projectName;

        return projectDocument;
    }


    public static createConfigurationDocument(settings: Settings, template: Template,
                                              selectedLanguages: string[]): ConfigurationDocument {

        return {
            _id: 'configuration',
            resource: {
                category: 'Configuration',
                identifier: 'Configuration',
                id: 'configuration',
                forms: template.configuration.forms,
                order: template.configuration.order,
                valuelists: {},
                languages: template.configuration.languages ?? {},
                projectLanguages: selectedLanguages,
                relations: {}
            },
            created: { user: settings.username, date: new Date() },
            modified: [{ user: settings.username, date: new Date() }]
        };
    }


    private static async checkDatabaseExistence(url: string): Promise<boolean> {

        try {
            const info = await new PouchDB(url, { skip_setup: true }).info();
            if (info.error) return false;
        } catch (err) {
            return false;
        }

        return true;
    }


    private static isSynchronizationAllowed(project: string): boolean {

        return project !== undefined && (project !== 'test' || (!remote || remote.getGlobal('mode') === 'test'));
    }


    private static validateAddress(address: any): boolean {

        return (address === '')
            ? true
            : validateUrl(address);
    }
}
