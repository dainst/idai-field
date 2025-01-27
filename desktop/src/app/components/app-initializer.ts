import { Map, to } from 'tsfun';
import { ConfigLoader, ConfigReader, ConfigurationDocument, ConstraintIndex,
    DocumentCache, FulltextIndex, ImageStore, Indexer, IndexFacade, PouchdbDatastore,
    ProjectConfiguration, Document, Labels, ImageVariant, FileInfo } from 'idai-field-core';
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
import { Languages } from '../services/languages';
import { createDisplayVariant } from '../services/imagestore/create-display-variant';


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


export const appInitializerFactory = (serviceLocator: AppInitializerServiceLocator,
                                      settingsService: SettingsService,
                                      pouchdbDatastore: PouchdbDatastore,
                                      imagestore: ImageStore,
                                      expressServer: ExpressServer,
                                      documentCache: DocumentCache,
                                      thumbnailGenerator: ThumbnailGenerator,
                                      progress: InitializationProgress,
                                      configReader: ConfigReader,
                                      configLoader: ConfigLoader) => async (): Promise<void> => {

    progress.setLocale(Settings.getLocale());
    await setupServer(expressServer, progress);

    let settings = await loadSettings(settingsService, progress);
    await setUpDatabase(settingsService, settings, progress);
    await loadSampleData(settings, pouchdbDatastore.getDb(), thumbnailGenerator, imagestore, progress);

    settings = await updateProjectNameInSettings(settingsService, pouchdbDatastore.getDb());
    await setProjectNameInProgress(settings, progress);
    await copyThumbnailsFromDatabase(settings.selectedProject, pouchdbDatastore, imagestore);
    await createDisplayImages(imagestore, pouchdbDatastore.getDb(), settings.selectedProject, progress);

    const services = await loadConfiguration(
        settingsService, progress, configReader, configLoader, pouchdbDatastore.getDb(),
        settings.selectedProject, settings.username
    );
    serviceLocator.init(services);

    await loadDocuments(serviceLocator, pouchdbDatastore.getDb(), documentCache, progress);

    return await AngularUtility.refresh(700);
};


const setupServer = async (expressServer: ExpressServer, progress: InitializationProgress) => {

    try {
        await expressServer.setupServer();
    } catch (err) {
        progress.setError('alreadyOpenError');
        return Promise.reject('Application is already open');
    }
}


const loadSettings = async (settingsService: SettingsService, progress: InitializationProgress): Promise<Settings> => {

    await progress.setPhase('loadingSettings');
    
    const settings = await settingsService.updateSettings(await (new SettingsSerializer()).load());    

    return settings;
};


const setProjectNameInProgress = async (settings: Settings, progress: InitializationProgress) => {

    const projectIdentifier = settings.dbs[0];
    const labels: Labels = new Labels(new Languages().get);
    const projectName = labels.getFromI18NString(settings.projectNames?.[projectIdentifier]);

    await progress.setProjectName(
        projectName ?? projectIdentifier,
        projectName ? projectIdentifier : undefined
    );
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
        return Promise.reject('Database error');
    }
};


const loadSampleData = async (settings: Settings, db: PouchDB.Database, thumbnailGenerator: ThumbnailGenerator,
                              imagestore: ImageStore, progress: InitializationProgress) => {

    if (settings.selectedProject !== 'test') return;

    await progress.setPhase('loadingSampleObjects');
    await imagestore.deleteData(settings.selectedProject);

    const loader = new SampleDataLoader(thumbnailGenerator, settings.imagestorePath, Settings.getLocale());
    return loader.go(db, settings.selectedProject);
};


const loadConfiguration = async (settingsService: SettingsService, progress: InitializationProgress,
                                 configReader: ConfigReader, configLoader: ConfigLoader,
                                 db: PouchDB.Database, projectIdentifier: string, username: string): Promise<Services> => {

    await progress.setPhase('loadingConfiguration');

    let configuration: ProjectConfiguration;
    try {
        configuration = await settingsService.loadConfiguration();
    } catch (err) {
        progress.setError('configurationError', err);
        return Promise.reject('Configuration error');
    }

    const { createdConstraintIndex, createdFulltextIndex, createdIndexFacade }
        = IndexerConfiguration.configureIndexers(configuration);

    const configurationIndex = await buildConfigurationIndex(
        configReader, configLoader, db, configuration, projectIdentifier, username
    );

    return {
        projectConfiguration: configuration,
        constraintIndex: createdConstraintIndex,
        fulltextIndex: createdFulltextIndex,
        indexFacade: createdIndexFacade,
        configurationIndex
    };
};


const loadDocuments = async (serviceLocator: AppInitializerServiceLocator,
                             db: PouchDB.Database<{}>,
                             documentCache: DocumentCache,
                             progress: InitializationProgress) => {

    await progress.setPhase('loadingDocuments');
    progress.setMaxIndexingProgress((await db.info()).doc_count);

    await Indexer.reindex(
        serviceLocator.indexFacade,
        db,
        documentCache,
        serviceLocator.projectConfiguration,
        false,
        (count) => progress.setIndexingProgress(count),
        () => progress.setPhase('indexingDocuments'),
        (error) => progress.setError(error)
    );
};


const updateProjectNameInSettings = async (settingsService: SettingsService,
                                           db: PouchDB.Database<{}>): Promise<Settings> => {

    const projectDocument = await db.get('project') as Document;
    return await settingsService.updateProjectName(projectDocument);
};


const buildConfigurationIndex = async (configReader: ConfigReader, configLoader: ConfigLoader, db: PouchDB.Database,
                                       configuration: ProjectConfiguration, projectIdentifier: string,
                                       username: string): Promise<ConfigurationIndex> => {

    const configurationIndex: ConfigurationIndex = new ConfigurationIndex(
        configReader, configLoader, configuration, projectIdentifier
    );

    const configurationDocument: ConfigurationDocument = await ConfigurationDocument.getConfigurationDocument(
        (id: string) => db.get(id), configReader, projectIdentifier, username,
    );
    await configurationIndex.rebuild(configurationDocument);

    return configurationIndex;
};


const createDisplayImages = async (imagestore: ImageStore, db: PouchDB.Database, projectIdentifier: string,
                                   progress: InitializationProgress) => {

    const fileInfos: Map<FileInfo> = await imagestore.getFileInfos(
        projectIdentifier,
        [ImageVariant.ORIGINAL, ImageVariant.DISPLAY]
    );

    const imageIds: string[] = Object.keys(fileInfos).filter(imageId => {
        if (fileInfos[imageId].deleted) return false;
        const variants: Array<ImageVariant> = fileInfos[imageId].variants.map(to('name'));
        return variants.includes(ImageVariant.ORIGINAL) && !variants.includes(ImageVariant.DISPLAY);
    });

    if (imageIds.length === 0) return;
    
    await progress.setPhase('processingImages');
    progress.setImagesToProcess(imageIds.length);

    let count: number = 0;
    for (let imageId of imageIds) {
        await createDisplayImage(imageId, imagestore, db);    
        progress.setProcessedImages(++count);
    }
}


const createDisplayImage = async (imageId: string, imagestore: ImageStore, db: PouchDB.Database) => {

    try {
        await createDisplayVariant(
            await db.get(imageId),
            imagestore,
            await imagestore.getData(imageId, ImageVariant.ORIGINAL)
        );
    } catch (err) {
        console.warn('Failed to create display variant for image ' + imageId, err);
    }
};
