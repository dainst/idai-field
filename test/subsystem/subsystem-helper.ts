import * as PouchDB from 'pouchdb';
import {IdaiFieldAppConfigurator, ConfigLoader, ConfigReader, Document, Query} from 'idai-components-2';
import {ImageDatastore} from '../../app/core/datastore/field/image-datastore';
import {FieldDatastore} from '../../app/core/datastore/field/field-datastore';
import {DocumentDatastore} from '../../app/core/datastore/document-datastore';
import {TypeUtility} from '../../app/core/model/type-utility';
import {FieldTypeConverter} from '../../app/core/datastore/field/field-type-converter.service';
import {IndexerConfiguration} from '../../app/indexer-configuration';
import {PouchdbDatastore} from '../../app/core/datastore/core/pouchdb-datastore';
import {DocumentCache} from '../../app/core/datastore/core/document-cache';
import {PouchdbManager} from '../../app/core/datastore/core/pouchdb-manager';
import {PouchDbFsImagestore} from '../../app/core/imagestore/pouch-db-fs-imagestore';
import {Imagestore} from '../../app/core/imagestore/imagestore';
import {RemoteChangesStream} from '../../app/core/datastore/core/remote-changes-stream';
import {ResourcesStateManagerConfiguration} from '../../app/components/resources/view/resources-state-manager-configuration';
import {StandardStateSerializer} from '../../app/common/standard-state-serializer';
import {ViewFacade} from '../../app/components/resources/view/view-facade';
import {PersistenceManager} from '../../app/core/model/persistence-manager';
import {DocumentHolder} from '../../app/components/docedit/document-holder';
import {Validator} from '../../app/core/model/validator';
import {SyncTarget} from '../../app/core/settings/settings';
import {FsConfigReader} from '../../app/core/util/fs-config-reader';
import {SettingsService} from '../../app/core/settings/settings-service';


class IdGenerator {
    public generateId() {
        return Math.floor(Math.random() * 10000000).toString();
    }
}


/**
 * Boot project via settings service such that it immediately starts syncinc with http://localhost:3003/synctestremotedb
 */
export async function setupSettingsService(pouchdbmanager, projectName = 'testdb', startSync = false) {

    const settingsService = new SettingsService(
        new PouchDbFsImagestore(
            undefined, undefined, pouchdbmanager.getDbProxy()) as Imagestore,
        pouchdbmanager,
        undefined,
        new IdaiFieldAppConfigurator(
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
        syncTarget: new class implements SyncTarget {
            address: string = 'http://localhost:3003/';
            password: string;
            username: string;
        },
        dbs: [projectName],
        imagestorePath: process.cwd() + '/test/test-temp/imagestore',
        model3DStorePath: process.cwd() + '/test/test-temp/model3dstore',
        username: 'synctestuser'
    });

    const projectConfiguration = await settingsService.loadConfiguration('./config/');
    return {settingsService, projectConfiguration};
}


export async function createApp(projectName = 'testdb', startSync = false) {

    const pouchdbmanager = new PouchdbManager();

    const {settingsService, projectConfiguration} = await setupSettingsService(
        pouchdbmanager, projectName, startSync);

    const {createdConstraintIndex, createdFulltextIndex, createdIndexFacade} =
        IndexerConfiguration.configureIndexers(projectConfiguration);

    const datastore = new PouchdbDatastore(
        pouchdbmanager.getDbProxy(),
        new IdGenerator(),
        true);

    const documentCache = new DocumentCache<Document>();

    const typeUtility = new TypeUtility(projectConfiguration);

    const typeConverter = new FieldTypeConverter(typeUtility);

    const idaiFieldDocumentDatastore = new FieldDatastore(
        datastore, createdIndexFacade, documentCache as any, typeConverter);
    const idaiFieldImageDocumentDatastore = new ImageDatastore(
        datastore, createdIndexFacade, documentCache as any, typeConverter);
    const documentDatastore = new DocumentDatastore(
        datastore, createdIndexFacade, documentCache, typeConverter);

    const remoteChangesStream = new RemoteChangesStream(
        datastore,
        createdIndexFacade,
        documentCache,
        typeConverter,
        { getUsername: () => 'fakeuser' });

    const resourcesStateManager = ResourcesStateManagerConfiguration.build(
        projectConfiguration,
        idaiFieldDocumentDatastore,
        new StandardStateSerializer(settingsService),
        'synctest',
        true,
        'de'
    );

    const viewFacade = new ViewFacade(
        projectConfiguration,
        idaiFieldDocumentDatastore,
        remoteChangesStream,
        resourcesStateManager,
        undefined,
        createdIndexFacade
    );

    const persistenceManager = new PersistenceManager(
        idaiFieldDocumentDatastore,
        projectConfiguration,
        typeUtility,
    );

    const documentHolder = new DocumentHolder(
        projectConfiguration,
        persistenceManager,
        new Validator(projectConfiguration, (q: Query) => idaiFieldDocumentDatastore.find(q), typeUtility),
        undefined,
        undefined,
        typeUtility,
        { getUsername: () => 'fakeuser' },
        documentDatastore
    );

    return {
        remoteChangesStream,
        viewFacade,
        documentHolder,
        documentDatastore,
        idaiFieldDocumentDatastore,
        idaiFieldImageDocumentDatastore,
        settingsService
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