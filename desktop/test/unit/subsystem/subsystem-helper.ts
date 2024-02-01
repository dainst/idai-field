import { sameset } from 'tsfun';
import { AppConfigurator, DocumentConverter, ChangesStream, ConfigLoader, ConfigReader, createDocuments, Datastore,
    Document, DocumentCache, NiceDocs, PouchdbDatastore, Query, RelationsManager, Resource, SyncService, ImageStore,
    ImageSyncService } from 'idai-field-core';
import { ExpressServer } from '../../../src/app/services/express-server';
import { ImageDocumentsManager } from '../../../src/app/components/image/overview/view/image-documents-manager';
import { ImageOverviewFacade } from '../../../src/app/components/image/overview/view/imageoverview-facade';
import { ImagesState } from '../../../src/app/components/image/overview/view/images-state';
import { makeDocumentsLookup } from '../../../src/app/components/import/import/utils';
import { ImageRelationsManager } from '../../../src/app/services/image-relations-manager';
import { Validator } from '../../../src/app/model/validator';
import { ResourcesStateManager } from '../../../src/app/components/resources/view/resources-state-manager';
import { ViewFacade } from '../../../src/app/components/resources/view/view-facade';
import { SettingsProvider } from '../../../src/app/services/settings/settings-provider';
import { SettingsService } from '../../../src/app/services/settings/settings-service';
import { TabManager } from '../../../src/app/services/tabs/tab-manager';
import { IndexerConfiguration } from '../../../src/app/indexer-configuration';
import { StateSerializer } from '../../../src/app/services/state-serializer';
import { makeExpectDocuments } from '../../../../core/test/test-helpers';
import { FsAdapter } from '../../../src/app/services/imagestore/fs-adapter';
import { ThumbnailGenerator } from '../../../src/app/services/imagestore/thumbnail-generator';
import { RemoteImageStore } from '../../../src/app/services/imagestore/remote-image-store';
import { DocumentHolder } from '../../../src/app/components/docedit/document-holder';

import PouchDB = require('pouchdb-node');
import { Messages } from '../../../src/app/components/messages/messages';

const fs = require('fs');


class IdGenerator {

    public generateId() {

        return Math.floor(Math.random() * 10000000).toString();
    }
}


/**
 * Boot project via settings service such that it immediately starts syncinc with http://localhost:3003/synctestremotedb
 */
export async function setupSettingsService(pouchdbDatastore, projectIdentifier = 'testdb') {

    const pouchdbServer = new ExpressServer(undefined);
    const settingsProvider = new SettingsProvider();
    const fileSystemAdapter = new FsAdapter();
    const mockMessages = new Messages(undefined, 0);
    const imageStore = new ImageStore(
        fileSystemAdapter,
        new ThumbnailGenerator()
    ) as ImageStore;

    const remoteImageStore = new RemoteImageStore(settingsProvider, mockMessages);

    const imageSync = new ImageSyncService(imageStore, remoteImageStore, pouchdbDatastore);
    const configReader = new ConfigReader();

    const settingsService = new SettingsService(
        imageStore,
        pouchdbDatastore,
        pouchdbServer,
        undefined,
        new AppConfigurator(new ConfigLoader(configReader)),
        undefined,
        imageSync,
        settingsProvider,
        configReader
    );

    const settings = await settingsService.updateSettings({
        languages: ['de', 'en'],
        isAutoUpdateActive: false,
        hostPassword: '',
        syncTargets: {},
        dbs: [projectIdentifier],
        selectedProject: '',
        imagestorePath: process.cwd() + '/test/test-temp/imagestore',
        username: 'synctestuser'
    });

    await settingsService.bootProjectDb(
        settings.selectedProject,
        SettingsService.createProjectDocument(settings),
        true
    );

    const projectConfiguration = await settingsService.loadConfiguration();
    return { settingsService, projectConfiguration, fileSystemAdapter, imageStore, remoteImageStore, settingsProvider };
}


export interface App {

    remoteChangesStream: ChangesStream;
    viewFacade: ViewFacade;
    documentHolder: DocumentHolder;
    datastore: Datastore;
    settingsService: SettingsService;
    settingsProvider: SettingsProvider;
    resourcesStateManager: ResourcesStateManager;
    stateSerializer: StateSerializer;
    tabManager: TabManager;
    imageOverviewFacade: ImageOverviewFacade;
    relationsManager: RelationsManager;
    imageStore: ImageStore;
    imageRelationsManager: ImageRelationsManager;
}


export async function createApp(projectIdentifier = 'testdb'): Promise<App> {

    const pouchdbDatastore = new PouchdbDatastore(
        (name: string) => new PouchDB(name),
        new IdGenerator());
    pouchdbDatastore.createDbForTesting(projectIdentifier);
    pouchdbDatastore.setupChangesEmitter();

    const {
        settingsService,
        projectConfiguration,
        settingsProvider,
        imageStore
    } = await setupSettingsService(pouchdbDatastore, projectIdentifier);

    const { createdIndexFacade } = IndexerConfiguration.configureIndexers(projectConfiguration);

    await imageStore.init(settingsProvider.getSettings().imagestorePath, settingsProvider.getSettings().selectedProject);

    const documentCache = new DocumentCache();
    const documentConverter = new DocumentConverter(projectConfiguration);

    const datastore = new Datastore(
        pouchdbDatastore,
        createdIndexFacade,
        documentCache,
        documentConverter,
        projectConfiguration,
        () => settingsProvider.getSettings().username
    );

    const remoteChangesStream = new ChangesStream(
        pouchdbDatastore,
        datastore,
        createdIndexFacade,
        documentCache,
        documentConverter,
        projectConfiguration,
        () => settingsProvider.getSettings().username
    );

    const stateSerializer = jasmine.createSpyObj('stateSerializer', ['load', 'store']);
    stateSerializer.load.and.returnValue(Promise.resolve({}));
    stateSerializer.store.and.returnValue(Promise.resolve());

    const tabSpaceCalculator = jasmine.createSpyObj('tabSpaceCalculator',
        ['getTabSpaceWidth', 'getTabWidth']);
    tabSpaceCalculator.getTabSpaceWidth.and.returnValue(1000);
    tabSpaceCalculator.getTabWidth.and.returnValue(0);

    const tabManager = new TabManager(createdIndexFacade, tabSpaceCalculator, stateSerializer,
        datastore,
        () => Promise.resolve());
    tabManager.routeChanged('/project');

    const resourcesStateManager = new ResourcesStateManager(
        datastore,
        createdIndexFacade,
        stateSerializer,
        tabManager,
        projectIdentifier,
        projectConfiguration,
        true
    );

    const messages = jasmine.createSpyObj('messages', ['add']);

    const viewFacade = new ViewFacade(
        datastore,
        remoteChangesStream,
        resourcesStateManager,
        undefined,
        createdIndexFacade,
        messages,
        new SyncService(pouchdbDatastore)
    );

    const relationsManager = new RelationsManager(
        datastore,
        projectConfiguration,
    );

    const imageRelationsManager = new ImageRelationsManager(
        datastore,
        relationsManager,
        imageStore,
        projectConfiguration
    );

    const documentHolder = new DocumentHolder(
        projectConfiguration,
        relationsManager,
        new Validator(projectConfiguration, (q: Query) => datastore.find(q)),
        datastore,
        new IdGenerator()
    );

    const imagesState = new ImagesState(projectConfiguration);
    const imageDocumentsManager = new ImageDocumentsManager(imagesState, datastore);
    const imageOverviewFacade = new ImageOverviewFacade(imageDocumentsManager, imagesState, projectConfiguration);

    return {
        remoteChangesStream,
        viewFacade,
        documentHolder,
        datastore,
        settingsService,
        settingsProvider,
        resourcesStateManager,
        stateSerializer,
        tabManager,
        imageOverviewFacade,
        relationsManager,
        imageStore,
        imageRelationsManager
    };
}


export function createHelpers(app) {

    const projectImageDir = app.settingsProvider.getSettings().imagestorePath
        + app.settingsProvider.getSettings().selectedProject
        + '/';
    // tslint:disable-next-line: no-shadowed-variable
    const createDocuments = makeCreateDocuments(
        app.datastore, projectImageDir, app.settingsProvider.getSettings().username);
    const updateDocument = makeUpdateDocument(
        app.datastore, app.settingsProvider.getSettings().username);
    const getDocument = makeGetDocument(app.datastore);
    const expectDocuments = makeExpectDocuments(app.datastore);
    const expectResources = makeExpectResources(app.datastore);
    const expectImagesExist = makeExpectImagesExist(projectImageDir);
    const expectImagesDontExist = makeExpectImagesDontExist(projectImageDir);
    const createProjectDir = makeCreateProjectDir(projectImageDir);
    const createImageInProjectDir = makeCreateImageInProjectImageDir(projectImageDir);

    return {
        createDocuments,
        updateDocument,
        expectDocuments,
        expectResources,
        expectImagesExist,
        expectImagesDontExist,
        createProjectDir,
        createImageInProjectDir,
        getDocument
    };
}


function makeCreateProjectDir(projectImageDir) {

    return function createProjectDir() {
        try {
            if (fs.existsSync(projectImageDir)) {
                fs.rmSync(projectImageDir, { recursive: true });
            }
        } catch (e) {
            console.log('error deleting tmp project dir', e);
        }
        fs.mkdirSync(projectImageDir + 'thumbs/', { recursive: true });  // thumbnail directory is defined in ImageStore
    };
}


function makeExpectImagesExist(projectImageDir) {

    return function expectImagesExist(...ids) {

        for (const id of ids) {
            expect(fs.existsSync(projectImageDir + id)).toBeTruthy();
        }
    };
}


function makeExpectImagesDontExist(projectImageDir) {

    return function expectImagesDontExist(...ids) {

        for (const id of ids) {
            expect(fs.existsSync(projectImageDir + id)).not.toBeTruthy();
        }
    };
}


function makeCreateDocuments(datastore: Datastore,
                             projectImageDir: string,
                             username: string) {

    return async function create(documents: NiceDocs, project?: string) {

        const documentsLookup = createDocuments(documents);
        for (const document of Object.values(documentsLookup)) {
            if (project) document.project = project;
            await datastore.create(document);
        }
        for (const [id, type, _] of documents) {
            if (type === 'Image') makeCreateImageInProjectImageDir(projectImageDir)(id);
        }

        const storedDocuments = [];
        for (const doc of Object.values(documentsLookup)) {
            storedDocuments.push( await datastore.get(doc.resource.id) );
        }
        return makeDocumentsLookup(storedDocuments);
    };
}


function makeUpdateDocument(datastore: Datastore, username: string) {

    return async function updateDocument(id: Resource.Id,
                                         callback: (document: Document) => void) {

        const oldDocument = await datastore.get(id);
        callback(oldDocument);
        await datastore.update(oldDocument);
    };
}


function makeExpectResources(datastore: Datastore) {

    return async function expectDocuments(...resourceIdentifiers: string[]) {

        const documents = (await datastore.find({})).documents;
        expect(sameset(documents.map(doc => doc.resource.identifier), resourceIdentifiers)).toBeTruthy();
    };
}


function makeCreateImageInProjectImageDir(projectImageDir: string) {

    return function createImageInProjectImageDir(id: string) {

        fs.closeSync(fs.openSync(projectImageDir + id, 'w'));
        fs.closeSync(fs.openSync(projectImageDir + 'thumbs/' + id, 'w')); // thumbnail directory is defined in ImageStore
        expect(fs.existsSync(projectImageDir + id)).toBeTruthy();
        expect(fs.existsSync(projectImageDir + 'thumbs/' + id)).toBeTruthy(); // thumbnail directory is defined in ImageStore
    };
}


function makeGetDocument(datastore: Datastore) {

    return async function getDocument(id: Resource.Id) {

        return await datastore.get(id);
    };
}
