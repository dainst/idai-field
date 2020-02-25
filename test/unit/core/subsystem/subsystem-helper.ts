import * as PouchDB from 'pouchdb';
import {Document, ImageDocument, Query} from 'idai-components-2';
import {ImageDatastore} from '../../../../app/core/datastore/field/image-datastore';
import {FieldDatastore} from '../../../../app/core/datastore/field/field-datastore';
import {DocumentDatastore} from '../../../../app/core/datastore/document-datastore';
import {ProjectTypes} from '../../../../app/core/configuration/project-types';
import {FieldTypeConverter} from '../../../../app/core/datastore/field/field-type-converter';
import {IndexerConfiguration} from '../../../../app/indexer-configuration';
import {PouchdbDatastore} from '../../../../app/core/datastore/pouchdb/pouchdb-datastore';
import {DocumentCache} from '../../../../app/core/datastore/cached/document-cache';
import {PouchdbManager} from '../../../../app/core/datastore/pouchdb/pouchdb-manager';
import {ChangesStream} from '../../../../app/core/datastore/changes/changes-stream';
import {PersistenceManager} from '../../../../app/core/model/persistence-manager';
import {Validator} from '../../../../app/core/model/validator';
import {SyncTarget} from '../../../../app/core/settings/settings';
import {FsConfigReader} from '../../../../app/core/util/fs-config-reader';
import {SettingsService} from '../../../../app/core/settings/settings-service';
import {ImageOverviewFacade} from '../../../../app/core/images/overview/view/imageoverview-facade';
import {ImageDocumentsManager} from '../../../../app/core/images/overview/view/image-documents-manager';
import {ImagesState} from '../../../../app/core/images/overview/view/images-state';
import {ConfigLoader} from '../../../../app/core/configuration/boot/config-loader';
import {ConfigReader} from '../../../../app/core/configuration/boot/config-reader';
import {AppConfigurator} from '../../../../app/core/configuration/app-configurator';
import {TabManager} from '../../../../app/core/tabs/tab-manager';
import {PouchDbFsImagestore} from '../../../../app/core/images/imagestore/pouch-db-fs-imagestore';
import {Imagestore} from '../../../../app/core/images/imagestore/imagestore';
import {ViewFacade} from '../../../../app/core/resources/view/view-facade';
import {ResourcesStateManager} from '../../../../app/core/resources/view/resources-state-manager';
import {DocumentHolder} from '../../../../app/core/docedit/document-holder';
import { PouchdbServer } from '../../../../app/core/datastore/pouchdb/pouchdb-server';
import {DescendantsUtility} from '../../../../app/core/model/descendants-utility';


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

    const projectConfiguration = await settingsService.loadConfiguration('./config/');
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
    const typeUtility = new ProjectTypes(projectConfiguration);
    const typeConverter = new FieldTypeConverter(typeUtility, projectConfiguration);

    const fieldDocumentDatastore = new FieldDatastore(
        datastore, createdIndexFacade, documentCache as any, typeConverter);
    const documentDatastore = new DocumentDatastore(
        datastore, createdIndexFacade, documentCache, typeConverter);
    const imageDatastore = new ImageDatastore(datastore, createdIndexFacade,
        documentCache as DocumentCache<ImageDocument>, typeConverter);

    const remoteChangesStream = new ChangesStream(
        datastore,
        createdIndexFacade,
        documentCache,
        typeConverter,
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
        typeUtility,
        tabManager,
        projectName,
        true
    );

    const viewFacade = new ViewFacade(
        projectConfiguration,
        fieldDocumentDatastore,
        remoteChangesStream,
        resourcesStateManager,
        undefined,
        createdIndexFacade
    );

    const descendantsUtility = new DescendantsUtility(
        typeUtility, projectConfiguration, documentDatastore
    );

    const persistenceManager = new PersistenceManager(
        fieldDocumentDatastore,
        projectConfiguration,
        descendantsUtility
    );

    const documentHolder = new DocumentHolder(
        projectConfiguration,
        persistenceManager,
        new Validator(projectConfiguration, (q: Query) => fieldDocumentDatastore.find(q), typeUtility),
        typeUtility,
        { getUsername: () => 'fakeuser' },
        documentDatastore
    );

    const imagesState = new ImagesState();
    const imageDocumentsManager = new ImageDocumentsManager(imagesState, imageDatastore);
    const imageOverviewFacade = new ImageOverviewFacade(imageDocumentsManager, imagesState, typeUtility);

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
            'type': 'Project',
            'id': 'project',
            'identifier': projectName
        }
    });
    await synctest.close();
}