import { CategoryConverter, ConfigLoader, ConfigReader, ConfigurationDocument, ConstraintIndex,
    DocumentCache, FulltextIndex, getConfigurationName, ImageStore, Indexer, IndexFacade,
    PouchdbDatastore, ProjectConfiguration } from 'idai-field-core';
import { AngularUtility } from '../angular/angular-utility';
import { ThumbnailGenerator } from '../services/imagestore/thumbnail-generator';
import { InitializationProgress } from './initialization-progress';
import { IndexerConfiguration } from '../indexer-configuration';
import { SettingsService } from '../services/settings/settings-service';
import { SettingsSerializer } from '../services/settings/settings-serializer';
import { Settings } from '../services/settings/settings';
import { SampleDataLoader } from '../services/datastore/field/sampledata/sample-data-loader';
import { ExpressServer } from '../services/express-server';
import { ConfigurationIndex } from '../services/configuration/index/configuration-index';
import { copyThumbnailsFromDatabase } from '../migration/thumbnail-copy';


interface Services {

    projectConfiguration?: ProjectConfiguration;
    fulltextIndex?: FulltextIndex;
    constraintIndex?: ConstraintIndex;
    indexFacade?: IndexFacade;
    configurationIndex?: ConfigurationIndex;
}


export class AppInitializerServiceLocator {

    private services: Services = {};


    public init(services: Services) {

        this.services = services;
    }


    public get projectConfiguration(): ProjectConfiguration {

        if (!this.services.projectConfiguration) {
            console.error('Project configuration has not yet been provided');
            throw new Error('Project configuration has not yet been provided');
        }
        return this.services.projectConfiguration;
    }


    public get fulltextIndex(): FulltextIndex {

        if (!this.services.fulltextIndex) {
            console.error('Fulltext index has not yet been provided');
            throw new Error('Fulltext index has not yet been provided');
        }
        return this.services.fulltextIndex;
    }


    public get constraintIndex(): ConstraintIndex {

        if (!this.services.constraintIndex) {
            console.error('Constraint index has not yet been provided');
            throw new Error('Constraint index has not yet been provided');
        }
        return this.services.constraintIndex;
    }


    public get indexFacade(): IndexFacade {

        if (!this.services.indexFacade) {
            console.error('Index facade has not yet been provided');
            throw new Error('Index facade has not yet been provided');
        }
        return this.services.indexFacade;
    }


    public get configurationIndex(): ConfigurationIndex {

        if (!this.services.configurationIndex) {
            console.error('Configuration index has not yet been provided');
            throw new Error('Configuration index has not yet been provided');
        }
        return this.services.configurationIndex;
    }
}


export const appInitializerFactory = (
    serviceLocator: AppInitializerServiceLocator,
    settingsService: SettingsService,
    pouchdbDatastore: PouchdbDatastore,
    imageStore: ImageStore,
    expressServer: ExpressServer,
    documentCache: DocumentCache,
    thumbnailGenerator: ThumbnailGenerator,
    progress: InitializationProgress,
    configReader: ConfigReader,
    configLoader: ConfigLoader
) => async (): Promise<void> => {

    await expressServer.setupServer();

    const settings = await loadSettings(settingsService, progress);
    await setUpDatabase(settingsService, settings, progress);

    await loadSampleData(settings, pouchdbDatastore.getDb(), thumbnailGenerator, progress);

    await copyThumbnailsFromDatabase(settings.selectedProject, pouchdbDatastore, imageStore);

    const services = await loadConfiguration(
        settingsService, progress, configReader, configLoader, pouchdbDatastore.getDb(),
        settings.selectedProject, settings.username
    );
    serviceLocator.init(services);

    await loadDocuments(serviceLocator, pouchdbDatastore.getDb(), documentCache, progress);

    return await AngularUtility.refresh(700);
};


const loadSettings = async (settingsService: SettingsService, progress: InitializationProgress): Promise<Settings> => {

    await progress.setPhase('loadingSettings');
    const settings = await settingsService.updateSettings(await (new SettingsSerializer()).load());
    await progress.setEnvironment(settings.dbs[0], Settings.getLocale());

    return settings;
};


const setUpDatabase = async (settingsService: SettingsService, settings: Settings, progress: InitializationProgress) => {

    await progress.setPhase('settingUpDatabase');
    try {
        await settingsService.bootProjectDb(
            settings.selectedProject,
            settings.selectedProject === 'test'
                ? SettingsService.createProjectDocument(settings)
                : null,
            settings.selectedProject === 'test'
        );
    } catch (msgWithParams) {
        await progress.setError('databaseError');
        return Promise.reject();
    }
};


const loadSampleData = async (settings: Settings, db: PouchDB.Database, thumbnailGenerator: ThumbnailGenerator,
                              progress: InitializationProgress) => {

    if (settings.selectedProject === 'test') {
        await progress.setPhase('loadingSampleObjects');
        const loader = new SampleDataLoader(thumbnailGenerator, settings.imagestorePath, Settings.getLocale());
        return loader.go(db, settings.selectedProject);
    }
};


const loadConfiguration = async (settingsService: SettingsService, progress: InitializationProgress,
                                 configReader: ConfigReader, configLoader: ConfigLoader,
                                 db: PouchDB.Database, projectName: string, username: string): Promise<Services> => {

    await progress.setPhase('loadingConfiguration');

    let configuration: ProjectConfiguration;
    try {
        configuration = await settingsService.loadConfiguration();
    } catch (err) {
        progress.setError('configurationError', err);
        return Promise.reject();
    }

    const { createdConstraintIndex, createdFulltextIndex, createdIndexFacade }
        = IndexerConfiguration.configureIndexers(configuration);

    const configurationIndex = await buildConfigurationIndex(
        configReader, configLoader, db, configuration, projectName, username
    );

    return {
        projectConfiguration: configuration,
        constraintIndex: createdConstraintIndex,
        fulltextIndex: createdFulltextIndex,
        indexFacade: createdIndexFacade,
        configurationIndex
    };
};


const loadDocuments = async (
    serviceLocator: AppInitializerServiceLocator,
    db: PouchDB.Database<{}>,
    documentCache: DocumentCache,
    progress: InitializationProgress
) => {

    await progress.setPhase('loadingDocuments');
    progress.setDocumentsToIndex((await db.info()).doc_count);

    await Indexer.reindex(serviceLocator.indexFacade, db, documentCache,
        new CategoryConverter(serviceLocator.projectConfiguration),
        false,
        (count) => progress.setIndexedDocuments(count),
        () => progress.setPhase('indexingDocuments'),
        (error) => progress.setError(error)
    );
};


const buildConfigurationIndex = async (configReader: ConfigReader, configLoader: ConfigLoader, db: PouchDB.Database,
                                       configuration: ProjectConfiguration, projectName: string,
                                       username: string): Promise<ConfigurationIndex> => {

    const configurationIndex: ConfigurationIndex = new ConfigurationIndex(
        configReader, configLoader, configuration, projectName
    );

    const configurationDocument: ConfigurationDocument = await ConfigurationDocument.getConfigurationDocument(
        (id: string) => db.get(id), configReader, projectName, username,
    );
    await configurationIndex.rebuild(configurationDocument);

    return configurationIndex;
};
