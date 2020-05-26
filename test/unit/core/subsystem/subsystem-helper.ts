import * as PouchDB from 'pouchdb-node';
import {Document, ImageDocument} from 'idai-components-2';
import {ImageDatastore} from '../../../../src/app/core/datastore/field/image-datastore';
import {FieldDatastore} from '../../../../src/app/core/datastore/field/field-datastore';
import {DocumentDatastore} from '../../../../src/app/core/datastore/document-datastore';
import {ProjectCategories} from '../../../../src/app/core/configuration/project-categories';
import {FieldCategoryConverter} from '../../../../src/app/core/datastore/field/field-category-converter';
import {IndexerConfiguration} from '../../../../src/app/indexer-configuration';
import {PouchdbDatastore} from '../../../../src/app/core/datastore/pouchdb/pouchdb-datastore';
import {DocumentCache} from '../../../../src/app/core/datastore/cached/document-cache';
import {PouchdbManager} from '../../../../src/app/core/datastore/pouchdb/pouchdb-manager';
import {ChangesStream} from '../../../../src/app/core/datastore/changes/changes-stream';
import {PersistenceManager} from '../../../../src/app/core/model/persistence-manager';
import {Validator} from '../../../../src/app/core/model/validator';
import {SyncTarget} from '../../../../src/app/core/settings/settings';
import {FsConfigReader} from '../../../../src/app/core/util/fs-config-reader';
import {SettingsService} from '../../../../src/app/core/settings/settings-service';
import {ImageOverviewFacade} from '../../../../src/app/core/images/overview/view/imageoverview-facade';
import {ImageDocumentsManager} from '../../../../src/app/core/images/overview/view/image-documents-manager';
import {ImagesState} from '../../../../src/app/core/images/overview/view/images-state';
import {ConfigLoader} from '../../../../src/app/core/configuration/boot/config-loader';
import {ConfigReader} from '../../../../src/app/core/configuration/boot/config-reader';
import {AppConfigurator} from '../../../../src/app/core/configuration/app-configurator';
import {TabManager} from '../../../../src/app/core/tabs/tab-manager';
import {PouchDbFsImagestore} from '../../../../src/app/core/images/imagestore/pouch-db-fs-imagestore';
import {Imagestore} from '../../../../src/app/core/images/imagestore/imagestore';
import {ViewFacade} from '../../../../src/app/core/resources/view/view-facade';
import {ResourcesStateManager} from '../../../../src/app/core/resources/view/resources-state-manager';
import {DocumentHolder} from '../../../../src/app/core/docedit/document-holder';
import { PouchdbServer } from '../../../../src/app/core/datastore/pouchdb/pouchdb-server';
import {DescendantsUtility} from '../../../../src/app/core/model/descendants-utility';
import {Query} from '../../../../src/app/core/datastore/model/query';


class IdGenerator {
    public generateId() {
        return Math.floor(Math.random() * 10000000).toString();
    }
}


/**
 * Boot project via settings service such that it immediately starts syncinc with http://localhost:3003/synctestremotedb
 */
export async function setupSettingsService(pouchdbmanager, pouchdbserver, projectName = 'testdb', startSync = false) {

    const settingsService = new SettingsService(
        new PouchDbFsImagestore(
            undefined, undefined, pouchdbmanager.getDbProxy()) as Imagestore,
        pouchdbmanager,
        pouchdbserver,
        undefined,
        new AppConfigurator(
            new ConfigLoader(new FsConfigReader() as ConfigReader, () => ''),
            () => ''
        ),
        undefined,
        undefined
    );

    await settingsService.bootProjectDb({
        locale: 'de',
        isAutoUpdateActive: false,
        isSyncActive: startSync,
        remoteSites: [],
        hostPassword: "",
        syncTarget: new class implements SyncTarget {
            address: string = 'http://localhost:3003/';
            password: string;
            username: string;
        },
        dbs: [projectName],
        imagestorePath: process.cwd() + '/test/test-temp/imagestore',
        username: 'synctestuser'
    });

    const projectConfiguration = await settingsService.loadConfiguration('src/config/');
    return {settingsService, projectConfiguration};
}


export async function createApp(projectName = 'testdb', startSync = false) {

    const pouchdbmanager = new PouchdbManager();

    const pouchdbserver = new PouchdbServer();

    const {settingsService, projectConfiguration} = await setupSettingsService(
        pouchdbmanager, pouchdbserver, projectName, startSync);

    const {createdIndexFacade} = IndexerConfiguration.configureIndexers(projectConfiguration);

    const datastore = new PouchdbDatastore(
        pouchdbmanager.getDbProxy(),
        new IdGenerator(),
        true);

    const documentCache = new DocumentCache<Document>();
    const projectCategories = new ProjectCategories(projectConfiguration);
    const categoryConverter = new FieldCategoryConverter(projectCategories, projectConfiguration);

    const fieldDocumentDatastore = new FieldDatastore(
        datastore, createdIndexFacade, documentCache as any, categoryConverter);
    const documentDatastore = new DocumentDatastore(
        datastore, createdIndexFacade, documentCache, categoryConverter);
    const imageDatastore = new ImageDatastore(datastore, createdIndexFacade,
        documentCache as DocumentCache<ImageDocument>, categoryConverter);

    const remoteChangesStream = new ChangesStream(
        datastore,
        createdIndexFacade,
        documentCache,
        categoryConverter,
        settingsService);

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
        projectCategories,
        tabManager,
        projectName,
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
        messages
    );

    const descendantsUtility = new DescendantsUtility(
        projectCategories, projectConfiguration, documentDatastore
    );

    const persistenceManager = new PersistenceManager(
        fieldDocumentDatastore,
        projectConfiguration,
        descendantsUtility
    );

    const documentHolder = new DocumentHolder(
        projectConfiguration,
        persistenceManager,
        new Validator(projectConfiguration, (q: Query) => fieldDocumentDatastore.find(q), projectCategories),
        projectCategories,
        { getUsername: () => 'fakeuser' },
        documentDatastore
    );

    const imagesState = new ImagesState(projectCategories);
    const imageDocumentsManager = new ImageDocumentsManager(imagesState, imageDatastore);
    const imageOverviewFacade = new ImageOverviewFacade(imageDocumentsManager, imagesState, projectCategories);

    return {
        remoteChangesStream,
        viewFacade,
        documentHolder,
        documentDatastore,
        fieldDocumentDatastore,
        imageDatastore,
        settingsService,
        resourcesStateManager,
        stateSerializer,
        tabManager,
        imageOverviewFacade,
        persistenceManager
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
