import { ChangesStream, createDocuments, Datastore, Document, DocumentCache, ImageDocument, NiceDocs, PouchdbDatastore, PouchdbManager, Query, ResourceId, SyncService, toResourceId } from 'idai-field-core';
import * as PouchDB from 'pouchdb-node';
import { identity, sameset } from 'tsfun';
import { AppConfigurator } from '../../../../src/app/core/configuration/app-configurator';
import { ConfigLoader } from '../../../../src/app/core/configuration/boot/config-loader';
import { ConfigReader } from '../../../../src/app/core/configuration/boot/config-reader';
import { FieldConverter } from '../../../../src/app/core/datastore/field/category-converter';
import { PouchdbServer } from '../../../../src/app/core/datastore/pouchdb/pouchdb-server';
import { DocumentHolder } from '../../../../src/app/core/docedit/document-holder';
import { Imagestore } from '../../../../src/app/core/images/imagestore/imagestore';
import { PouchDbFsImagestore } from '../../../../src/app/core/images/imagestore/pouch-db-fs-imagestore';
import { ImageDocumentsManager } from '../../../../src/app/core/images/overview/view/image-documents-manager';
import { ImageOverviewFacade } from '../../../../src/app/core/images/overview/view/imageoverview-facade';
import { ImagesState } from '../../../../src/app/core/images/overview/view/images-state';
import { makeDocumentsLookup } from '../../../../src/app/core/import/import/utils';
import { ImageRelationsManager } from '../../../../src/app/core/model/image-relations-manager';
import { RelationsManager } from '../../../../src/app/core/model/relations-manager';
import { Validator } from '../../../../src/app/core/model/validator';
import { ResourcesStateManager } from '../../../../src/app/core/resources/view/resources-state-manager';
import { ViewFacade } from '../../../../src/app/core/resources/view/view-facade';
import { SyncTarget } from '../../../../src/app/core/settings/settings';
import { SettingsProvider } from '../../../../src/app/core/settings/settings-provider';
import { SettingsService } from '../../../../src/app/core/settings/settings-service';
import { TabManager } from '../../../../src/app/core/tabs/tab-manager';
import { IndexerConfiguration } from '../../../../src/app/indexer-configuration';

const fs = require('fs');



class IdGenerator {
    public generateId() {
        return Math.floor(Math.random() * 10000000).toString();
    }
}


/**
 * Boot project via settings service such that it immediately starts syncinc with http://localhost:3003/synctestremotedb
 */
export async function setupSettingsService(pouchdbmanager, pouchdbserver, projectName = 'testdb') {

    const settingsProvider = new SettingsProvider();

    const settingsService = new SettingsService(
        new PouchDbFsImagestore(
            undefined, undefined, pouchdbmanager.getDb()) as Imagestore,
        pouchdbmanager,
        pouchdbserver,
        undefined,
        new AppConfigurator(new ConfigLoader(new ConfigReader())),
        undefined,
        settingsProvider
    );

    const settings = await settingsService.updateSettings({
        languages: ['de', 'en'],
        isAutoUpdateActive: false,
        isSyncActive: false,
        remoteSites: [],
        hostPassword: '',
        syncTarget: new class implements SyncTarget {
            address: string = 'http://localhost:3003/';
            password: string;
            username: string;
        },
        dbs: [projectName],
        selectedProject: '',
        imagestorePath: process.cwd() + '/test/test-temp/imagestore',
        username: 'synctestuser'
    });

    await settingsService.bootProjectDb(settings.selectedProject, true);

    const projectConfiguration = await settingsService.loadConfiguration('src/config/');
    return {settingsService, projectConfiguration, settingsProvider};
}


export async function createApp(projectName = 'testdb') {

    const pouchdbManager = new PouchdbManager((name: string) => new PouchDB(name));
    const pouchdbServer = new PouchdbServer();

    const {settingsService, projectConfiguration, settingsProvider} = await setupSettingsService(
        pouchdbManager, pouchdbServer, projectName);

    const {createdIndexFacade} = IndexerConfiguration.configureIndexers(projectConfiguration);

    const pouchdbDatastore = new PouchdbDatastore(
        pouchdbManager.getDb(),
        new IdGenerator(),
        true);

    const imagestore = new PouchDbFsImagestore(undefined, undefined, pouchdbManager.getDb());
    imagestore.init(settingsProvider.getSettings());

    const documentCache = new DocumentCache();
    const categoryConverter = new FieldConverter(projectConfiguration);

    const datastore = new Datastore(
        pouchdbDatastore, createdIndexFacade, documentCache, categoryConverter);

    const remoteChangesStream = new ChangesStream(
        pouchdbDatastore,
        createdIndexFacade,
        documentCache,
        categoryConverter,
        () => settingsProvider.getSettings().username);

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
        projectName,
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
        new SyncService(pouchdbManager)
    );

    const relationsManager = new RelationsManager(
        datastore,
        projectConfiguration,
        settingsProvider
    );

    const imageRelationsManager = new ImageRelationsManager(
        datastore,
        relationsManager,
        imagestore,
        projectConfiguration
    );

    const documentHolder = new DocumentHolder(
        projectConfiguration,
        relationsManager,
        new Validator(projectConfiguration, (q: Query) => datastore.find(q)),
        datastore
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
        imagestore,
        imageRelationsManager
    }
}


export function createHelpers(app) {

    const projectImageDir = app.settingsProvider.getSettings().imagestorePath
        + app.settingsProvider.getSettings().selectedProject
        + '/';
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
    }
}


function makeCreateProjectDir(projectImageDir) {

    return function createProjectDir() {
        try {
            // TODO node 12 supports fs.rmdirSync(path, {recursive: true})
            const files = fs.readdirSync(projectImageDir);
            for (const file of files) {
                fs.unlinkSync(projectImageDir + file);
            }
            if (fs.existsSync(projectImageDir)) fs.rmdirSync(projectImageDir);
        } catch (e) {
            console.log("error deleting tmp project dir", e)
        }
        fs.mkdirSync(projectImageDir, { recursive: true });
    }
}


function makeExpectImagesExist(projectImageDir) {

    return function expectImagesExist(...ids) {

        for (const id of ids) {
            expect(fs.existsSync(projectImageDir + id)).toBeTruthy();
        }
    }
}


function makeExpectImagesDontExist(projectImageDir) {

    return function expectImagesDontExist(...ids) {

        for (const id of ids) {
            expect(fs.existsSync(projectImageDir + id)).not.toBeTruthy();
        }
    }
}


/**
 * Creates the db that is in the simulated client app
 * TODO: still necessary now that destroyBeforeCreate is set to true?
 */
export async function setupSyncTestDb(projectName = 'testdb') {

    let synctest = new PouchDB(projectName);
    await synctest.destroy();
    synctest = new PouchDB(projectName);
    await synctest.put({
        '_id': 'project',
        'resource': {
            'category': 'Project',
            'id': 'project',
            'identifier': projectName
        }
    });
    await synctest.close();
}


function makeCreateDocuments(datastore: Datastore,
                             projectImageDir: string,
                             username: string) {

    return async function create(documents: NiceDocs, project?: string) {

        const documentsLookup = createDocuments(documents);
        for (const document of Object.values(documentsLookup)) {
            if (project) document.project = project;
            await datastore.create(document, username);
        }
        for (const [id, type, _] of documents) {
            if (type === 'Image') makeCreateImageInProjectImageDir(projectImageDir)(id);
        }

        const storedDocuments = [];
        for (const doc of Object.values(documentsLookup)) {
            storedDocuments.push( await datastore.get(doc.resource.id) );
        }
        return makeDocumentsLookup(storedDocuments);
    }
}


function makeUpdateDocument(datastore: Datastore, username: string) {

    return async function updateDocument(id: ResourceId,
                                         callback: (document: Document) => void) {

        const oldDocument = await datastore.get(id);
        callback(oldDocument);
        await datastore.update(oldDocument, username);
    }
}

function makeExpectDocuments(datastore: Datastore) {

    return async function expectDocuments(...resourceIds: string[]) {

        const documents = (await datastore.find({})).documents;
        expect(sameset(documents.map(toResourceId), resourceIds)).toBeTruthy();
    }
}


function makeExpectResources(datastore: Datastore) {

    return async function expectDocuments(...resourceIdentifiers: string[]) {

        const documents = (await datastore.find({})).documents;
        expect(sameset(documents.map(doc => doc.resource.identifier), resourceIdentifiers)).toBeTruthy();
    }
}


function makeCreateImageInProjectImageDir(projectImageDir: string) {

    return function createImageInProjectImageDir(id: string) {

        fs.closeSync(fs.openSync(projectImageDir + id, 'w'));
        expect(fs.existsSync(projectImageDir + id)).toBeTruthy();
    }
}


function makeGetDocument(datastore: Datastore) {

    return async function getDocument(id: ResourceId) {

        return await datastore.get(id);
    }
}
