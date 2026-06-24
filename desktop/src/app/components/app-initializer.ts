import { Map, to } from 'tsfun';
import { ConfigLoader, ConfigReader, ConfigurationDocument, ConstraintIndex, DocumentCache, FulltextIndex, ImageStore,
    Indexer, IndexFacade, PouchdbDatastore, ProjectConfiguration, Document, Labels, ImageVariant, FileInfo,
    WarningsUpdater, WarningsManager, Warnings, IndexItem } from 'idai-field-core';
import { AngularUtility } from '../angular/angular-utility';
import { ThumbnailGenerator } from '../services/imagestore/thumbnail-generator';
import { InitializationProgress } from './initialization-progress';
import { IndexerConfiguration } from '../indexer-configuration';
import { SettingsService } from '../services/settings/settings-service';
import { SettingsSerializer } from '../services/settings/settings-serializer';
import { Settings } from '../services/settings/settings';
import { SampleDataLoader } from '../services/datastore/field/sampledata/sample-data-loader';
import { ExpressServer } from '../services/express-server/express-server';
import { ConfigurationIndex } from '../services/configuration/index/configuration-index';
import { copyThumbnailsFromDatabase } from '../migration/thumbnail-copy';
import { Languages } from '../services/languages';
import { createDisplayVariant } from '../services/imagestore/manipulation/create-display-variant';
import { Backup } from '../services/backup/model/backup';
import { BackupService } from '../services/backup/backup-service';
import { getExistingBackups } from '../services/backup/auto-backup/get-existing-backups';
import { SerializationObject } from '../services/serialization-service';

const ipcRenderer = window.require('electron')?.ipcRenderer;
const remote = window.require('@electron/remote');
const fs = window.require('fs');


interface Services {

    projectConfiguration?: ProjectConfiguration;
    fulltextIndex?: FulltextIndex;
    constraintIndex?: ConstraintIndex;
    indexFacade?: IndexFacade;
    configurationIndex?: ConfigurationIndex;
    warningsUpdater?: WarningsUpdater;
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


    public get warningsUpdater(): WarningsUpdater {

        if (!this.services.warningsUpdater) {
            console.error('Warnings updater has not yet been provided');
            throw new Error('Warnings updater has not yet been provided');
        }
        return this.services.warningsUpdater;
    }
}


export const appInitializerFactory = (serviceLocator: AppInitializerServiceLocator,
                                      settingsService: SettingsService,
                                      pouchdbDatastore: PouchdbDatastore,
                                      imagestore: ImageStore,
                                      expressServer: ExpressServer,
                                      documentCache: DocumentCache,
                                      warningsManager: WarningsManager,
                                      thumbnailGenerator: ThumbnailGenerator,
                                      progress: InitializationProgress,
                                      configReader: ConfigReader,
                                      configLoader: ConfigLoader) => async (): Promise<void> => {
    
    const onRequestClose = () => ipcRenderer.send('close');
    ipcRenderer.on('requestClose', onRequestClose);

    progress.setLocale(Settings.getLocale());
    await setupServer(expressServer, progress);

    let settings = await loadSettings(settingsService, progress);
    await setUpDatabase(settingsService, settings, progress);
    await loadSampleData(settings, pouchdbDatastore.getDb(), thumbnailGenerator, imagestore, progress);

    settings = await updateProjectNameInSettings(settingsService, pouchdbDatastore.getDb());
    await setProjectNameInProgress(settings, progress);
    await copyThumbnailsFromDatabase(settings.selectedProject, pouchdbDatastore, imagestore);
    await createDisplayImages(imagestore, pouchdbDatastore.getDb(), settings.selectedProject, progress);

    const projectConfiguration: ProjectConfiguration = await loadConfiguration(settingsService, progress);

    const loadedData = await loadIndexAndWarnings(pouchdbDatastore.getDb(), settings.selectedProject);
    const services: Services = loadedData
        ? await restoreIndexes(projectConfiguration, warningsManager, loadedData.constraintIndex,
            loadedData.fulltextIndex, loadedData.indexItems, loadedData.warnings, configReader, configLoader,
            pouchdbDatastore.getDb(), documentCache, settings.selectedProject, settings.username)
        : await buildIndexes(projectConfiguration, warningsManager, configReader, configLoader,
            pouchdbDatastore.getDb(), documentCache, settings.selectedProject, settings.username);
    serviceLocator.init(services);

    await loadDocuments(serviceLocator, pouchdbDatastore.getDb(), documentCache, progress, loadedData !== undefined);

    ipcRenderer.off('requestClose', onRequestClose);

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


const setUpDatabase = async (settingsService: SettingsService, settings: Settings,
                             progress: InitializationProgress) => {

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
        const success: boolean = await restoreLatestBackup(settingsService, settings);
        if (success) {
            await setUpDatabase(settingsService, settings, progress);
        } else {
            console.error(msgWithParams);
            await progress.setError('databaseError');
            return Promise.reject('Database error');
        }
    }
};


const loadSampleData = async (settings: Settings, db: any, thumbnailGenerator: ThumbnailGenerator,
                              imagestore: ImageStore, progress: InitializationProgress) => {

    if (settings.selectedProject !== 'test') return;

    await progress.setPhase('loadingSampleObjects');
    await imagestore.deleteData(settings.selectedProject);

    const loader = new SampleDataLoader(thumbnailGenerator, settings.imagestorePath, Settings.getLocale());
    return loader.go(db, settings.selectedProject);
};


const loadConfiguration = async (settingsService: SettingsService,
                                 progress: InitializationProgress): Promise<ProjectConfiguration> => {

    await progress.setPhase('loadingConfiguration');

    try {
        return settingsService.loadConfiguration();
    } catch (err) {
        progress.setError('configurationError', err);
        return Promise.reject('Configuration error');
    }
}


const restoreIndexes = async (projectConfiguration: ProjectConfiguration, warningsManager: WarningsManager,
                        constraintIndex: ConstraintIndex, fulltextIndex: FulltextIndex, indexItems: Map<IndexItem>,
                        warnings: Map<Warnings>, configReader: ConfigReader, configLoader: ConfigLoader, db: any,
                        documentCache: DocumentCache, projectIdentifier: string, username: string): Promise<Services> => {

    const indexFacade: IndexFacade = new IndexFacade(
        constraintIndex, fulltextIndex, projectConfiguration, warningsManager, true, indexItems
    );

    const configurationIndex: ConfigurationIndex = await buildConfigurationIndex(
        configReader, configLoader, db, projectConfiguration, projectIdentifier, username
    );

    warningsManager.setAll(warnings);

    const warningsUpdater: WarningsUpdater = new WarningsUpdater(
        warningsManager, indexFacade, documentCache, projectConfiguration
    );

    return {
        projectConfiguration,
        constraintIndex,
        fulltextIndex,
        indexFacade,
        configurationIndex,
        warningsUpdater
    };
};


const buildIndexes = async (projectConfiguration: ProjectConfiguration, warningsManager: WarningsManager,
                      configReader: ConfigReader, configLoader: ConfigLoader, db: any,
                      documentCache: DocumentCache, projectIdentifier: string,
                      username: string): Promise<Services> => {

    const { createdConstraintIndex, createdFulltextIndex, createdIndexFacade }
        = IndexerConfiguration.configureIndexers(projectConfiguration, warningsManager);

    const configurationIndex: ConfigurationIndex = await buildConfigurationIndex(
        configReader, configLoader, db, projectConfiguration, projectIdentifier, username
    );
    const warningsUpdater: WarningsUpdater = new WarningsUpdater(
        warningsManager, createdIndexFacade, documentCache, projectConfiguration
    );

    return {
        projectConfiguration,
        constraintIndex: createdConstraintIndex,
        fulltextIndex: createdFulltextIndex,
        indexFacade: createdIndexFacade,
        configurationIndex,
        warningsUpdater
    };
}


const loadIndexAndWarnings = async (db: any, projectIdentifier: string) => {

    const updateSequence: number = (await db.info()).update_seq;

    const fulltextIndex: FulltextIndex = deserialize('fulltextIndex.json', projectIdentifier, updateSequence);
    const constraintIndex: ConstraintIndex = deserialize('constraintIndex.json', projectIdentifier, updateSequence);
    const indexItems: Map<IndexItem> = deserialize('indexItems.json', projectIdentifier, updateSequence);
    const warnings: Map<Warnings> = deserialize('warnings.json', projectIdentifier, updateSequence);

    return warnings && fulltextIndex && constraintIndex// && configurationIndex
        ? { warnings, fulltextIndex, constraintIndex, indexItems }
        : undefined;
}


const deserialize = (fileName: string, projectIdentifier: string, updateSequence: number) => {

    try {
        const filePath: string = remote.getGlobal('appDataPath') + '/index/' + projectIdentifier + '/' + fileName;
        if (!fs.existsSync(filePath)) return undefined;

        const result: SerializationObject = JSON.parse(fs.readFileSync(filePath));

        if (result.version === remote.app.getVersion() && result.updateSequence === updateSequence) {
            return result.data;
        } else {
            return undefined;
        }
    } catch (err) {
        console.error('Failed to deserialize file ' + fileName, err);
        return undefined;
    }
}


const loadDocuments = async (serviceLocator: AppInitializerServiceLocator, db: any, documentCache: DocumentCache,
                             progress: InitializationProgress, useLoadedIndexes: boolean) => {

    await progress.setPhase('loadingDocuments');
    progress.setMaxIndexingProgress((await db.info()).doc_count);

    await Indexer.reindex(
        serviceLocator.indexFacade,
        db,
        documentCache,
        serviceLocator.warningsUpdater,
        serviceLocator.projectConfiguration,
        false,
        useLoadedIndexes,
        (count) => progress.setIndexingProgress(count),
        () => progress.setPhase('indexingDocuments'),
        (error) => progress.setError(error)
    );
};


const updateProjectNameInSettings = async (settingsService: SettingsService, db: any): Promise<Settings> => {

    const projectDocument = await db.get('project') as Document;
    return await settingsService.updateProjectName(projectDocument);
};


const buildConfigurationIndex = async (configReader: ConfigReader, configLoader: ConfigLoader, db: any,
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


const createDisplayImages = async (imagestore: ImageStore, db: any, projectIdentifier: string,
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


const createDisplayImage = async (imageId: string, imagestore: ImageStore, db: any) => {

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


const restoreLatestBackup = async (settingsService: SettingsService, settings: Settings): Promise<boolean> => {

    const backupFilePath: string = getPathToLatestBackupFile(settings);

    try {
        await new BackupService().restore(
            backupFilePath, settings.selectedProject, settingsService
        );
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}


const getPathToLatestBackupFile = (settings: Settings): string|undefined => {

    const backups: Array<Backup> = getExistingBackups(settings.backupDirectoryPath)[settings.selectedProject] ?? [];

    return backups.reverse()
        .map(backup => backup.filePath)
        .find(filePath => fs.existsSync(filePath));
}
