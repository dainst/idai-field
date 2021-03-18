import * as PouchDB from 'pouchdb-node';
import {Document, FieldDocument, ImageDocument, toResourceId} from 'idai-components-2';
import {ImageDatastore} from '../../../../src/app/core/datastore/field/image-datastore';
import {FieldDatastore} from '../../../../src/app/core/datastore/field/field-datastore';
import {DocumentDatastore} from '../../../../src/app/core/datastore/document-datastore';
import {FieldCategoryConverter} from '../../../../src/app/core/datastore/field/field-category-converter';
import {IndexerConfiguration} from '../../../../src/app/indexer-configuration';
import {PouchdbDatastore} from '../../../../src/app/core/datastore/pouchdb/pouchdb-datastore';
import {DocumentCache} from '../../../../src/app/core/datastore/cached/document-cache';
import {PouchdbManager} from '../../../../src/app/core/datastore/pouchdb/pouchdb-manager';
import {ChangesStream} from '../../../../src/app/core/datastore/changes/changes-stream';
import {RelationsManager} from '../../../../src/app/core/model/relations-manager';
import {Validator} from '../../../../src/app/core/model/validator';
import {SyncTarget} from '../../../../src/app/core/settings/settings';
import {SettingsService} from '../../../../src/app/core/settings/settings-service';
import {ImageOverviewFacade} from '../../../../src/app/core/images/overview/view/imageoverview-facade';
import {ImageDocumentsManager} from '../../../../src/app/core/images/overview/view/image-documents-manager';
import {ImagesState} from '../../../../src/app/core/images/overview/view/images-state';
import {ConfigLoader} from '../../../../src/app/core/configuration/boot/config-loader';
import {AppConfigurator} from '../../../../src/app/core/configuration/app-configurator';
import {TabManager} from '../../../../src/app/core/tabs/tab-manager';
import {PouchDbFsImagestore} from '../../../../src/app/core/images/imagestore/pouch-db-fs-imagestore';
import {Imagestore} from '../../../../src/app/core/images/imagestore/imagestore';
import {ViewFacade} from '../../../../src/app/core/resources/view/view-facade';
import {ResourcesStateManager} from '../../../../src/app/core/resources/view/resources-state-manager';
import {DocumentHolder} from '../../../../src/app/core/docedit/document-holder';
import { PouchdbServer } from '../../../../src/app/core/datastore/pouchdb/pouchdb-server';
import {Query} from '../../../../src/app/core/datastore/model/query';
import {CategoryConverter} from '../../../../src/app/core/datastore/cached/category-converter';
import {ConfigReader} from '../../../../src/app/core/configuration/boot/config-reader';
import {SettingsProvider} from '../../../../src/app/core/settings/settings-provider';
import {ImageRelationsManager} from '../../../../src/app/core/model/image-relations-manager';
import {SyncService} from '../../../../src/app/core/sync/sync-service';
import {createDocuments, NiceDocs} from '../../test-helpers';
import {sameset} from 'tsfun';
import {ResourceId} from '../../../../src/app/core/constants';
import {makeDocumentsLookup} from '../../../../src/app/core/import/import/utils';

const fs = require('fs');



class IdGenerator {
    public generateId() {
        return Math.floor(Math.random() * 10000000).toString();
    }
}


/**
 * Boot project via settings service such that it immediately starts syncinc with http://localhost:3003/synctestremotedb
 */
export async function setupSettingsService(pouchdbmanager, pouchdbserver, projectName = 'testdb', startSync = false) {

    const settingsProvider = new SettingsProvider();

    const settingsService = new SettingsService(
        new PouchDbFsImagestore(
            undefined, undefined, pouchdbmanager.getDbProxy()) as Imagestore,
        pouchdbmanager,
        pouchdbserver,
        undefined,
        new AppConfigurator(new ConfigLoader(new ConfigReader())),
        undefined,
        undefined,
        settingsProvider
    );

    await settingsService.bootProjectDb({
        languages: ['de', 'en'],
        isAutoUpdateActive: false,
        isSyncActive: startSync,
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

    const projectConfiguration = await settingsService.loadConfiguration('src/config/');
    return {settingsService, projectConfiguration, settingsProvider};
}


export async function createApp(projectName = 'testdb', startSync = false) {

    const pouchdbManager = new PouchdbManager();
    const pouchdbServer = new PouchdbServer();

    const {settingsService, projectConfiguration, settingsProvider} = await setupSettingsService(
        pouchdbManager, pouchdbServer, projectName, startSync);

    const {createdIndexFacade} = IndexerConfiguration.configureIndexers(projectConfiguration);

    const datastore = new PouchdbDatastore(
        pouchdbManager.getDbProxy(),
        new IdGenerator(),
        true);

    const imagestore = new PouchDbFsImagestore(undefined, undefined, pouchdbManager.getDbProxy());
    imagestore.init(settingsProvider.getSettings());

    const documentCache = new DocumentCache<Document>();
    const categoryConverter = new FieldCategoryConverter(projectConfiguration);

    const fieldDocumentDatastore = new FieldDatastore(
        datastore, createdIndexFacade, documentCache as any, categoryConverter as CategoryConverter<FieldDocument>);
    const documentDatastore = new DocumentDatastore(
        datastore, createdIndexFacade, documentCache, categoryConverter);
    const imageDatastore = new ImageDatastore(datastore, createdIndexFacade,
        documentCache as DocumentCache<ImageDocument>, categoryConverter as CategoryConverter<ImageDocument>);

    const remoteChangesStream = new ChangesStream(
        datastore,
        createdIndexFacade,
        documentCache,
        categoryConverter,
        settingsProvider);

    const stateSerializer = jasmine.createSpyObj('stateSerializer', ['load', 'store']);
    stateSerializer.load.and.returnValue(Promise.resolve({}));
    stateSerializer.store.and.returnValue(Promise.resolve());

    const tabSpaceCalculator = jasmine.createSpyObj('tabSpaceCalculator',
        ['getTabSpaceWidth', 'getTabWidth']);
    tabSpaceCalculator.getTabSpaceWidth.and.returnValue(1000);
    tabSpaceCalculator.getTabWidth.and.returnValue(0);

    const tabManager = new TabManager(createdIndexFacade, tabSpaceCalculator, stateSerializer,
        fieldDocumentDatastore,
        () => Promise.resolve());
    tabManager.routeChanged('/project');

    const resourcesStateManager = new ResourcesStateManager(
        fieldDocumentDatastore,
        createdIndexFacade,
        stateSerializer,
        tabManager,
        projectName,
        projectConfiguration,
        true
    );

    const messages = jasmine.createSpyObj('messages', ['add']);

    const viewFacade = new ViewFacade(
        projectConfiguration,
        fieldDocumentDatastore,
        remoteChangesStream,
        resourcesStateManager,
        undefined,
        createdIndexFacade,
        messages,
        new SyncService(pouchdbManager)
    );

    const relationsManager = new RelationsManager(
        documentDatastore,
        projectConfiguration,
        settingsProvider
    );

    const imageRelationsManager = new ImageRelationsManager(
        documentDatastore,
        relationsManager,
        imagestore,
        projectConfiguration
    );

    const documentHolder = new DocumentHolder(
        projectConfiguration,
        relationsManager,
        new Validator(projectConfiguration, (q: Query) => fieldDocumentDatastore.find(q)),
        documentDatastore
    );

    const imagesState = new ImagesState(projectConfiguration);
    const imageDocumentsManager = new ImageDocumentsManager(imagesState, imageDatastore);
    const imageOverviewFacade = new ImageOverviewFacade(imageDocumentsManager, imagesState, projectConfiguration);

    return {
        remoteChangesStream,
        viewFacade,
        documentHolder,
        documentDatastore,
        fieldDocumentDatastore,
        imageDatastore,
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
        app.documentDatastore, projectImageDir, app.settingsProvider.getSettings().username);
    const updateDocument = makeUpdateDocument(
        app.documentDatastore, app.settingsProvider.getSettings().username);
    const getDocument = makeGetDocument(app.documentDatastore);
    const expectDocuments = makeExpectDocuments(app.documentDatastore);
    const expectResources = makeExpectResources(app.documentDatastore);
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
            // node 12 supports fs.rmdirSync(path, {recursive: true})
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


function makeCreateDocuments(documentDatastore: DocumentDatastore,
                             projectImageDir: string,
                             username: string) {

    return async function create(documents: NiceDocs, project?: string) {

        const documentsLookup = createDocuments(documents);
        for (const document of Object.values(documentsLookup)) {
            if (project) document.project = project;
            await documentDatastore.create(document, username);
        }
        for (const [id, type, _] of documents) {
            if (type === 'Image') makeCreateImageInProjectImageDir(projectImageDir)(id);
        }

        const storedDocuments = [];
        for (const doc of Object.values(documentsLookup)) {
            storedDocuments.push(await documentDatastore.get(doc.resource.id));
        }
        return makeDocumentsLookup(storedDocuments);
    }
}


function makeUpdateDocument(documentDatastore: DocumentDatastore, username: string) {

    return async function updateDocument(id: ResourceId,
                                         callback: (document: Document) => void) {

        const oldDocument = await documentDatastore.get(id);
        callback(oldDocument);
        await documentDatastore.update(oldDocument, username);
    }
}

function makeExpectDocuments(documentDatastore: DocumentDatastore) {

    return async function expectDocuments(...resourceIds: string[]) {

        const documents = (await documentDatastore.find({})).documents;
        expect(sameset(documents.map(toResourceId), resourceIds)).toBeTruthy();
    }
}


function makeExpectResources(documentDatastore: DocumentDatastore) {

    return async function expectDocuments(...resourceIdentifiers: string[]) {

        const documents = (await documentDatastore.find({})).documents;
        expect(sameset(documents.map(doc => doc.resource.identifier), resourceIdentifiers)).toBeTruthy();
    }
}


function makeCreateImageInProjectImageDir(projectImageDir: string) {

    return function createImageInProjectImageDir(id: string) {

        fs.closeSync(fs.openSync(projectImageDir + id, 'w'));
        expect(fs.existsSync(projectImageDir + id)).toBeTruthy();
    }
}


function makeGetDocument(documentDatastore: DocumentDatastore) {

    return async function getDocument(id: ResourceId) {

        return await documentDatastore.get(id);
    }
}
