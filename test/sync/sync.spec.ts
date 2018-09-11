import {SettingsService} from '../../app/core/settings/settings-service';
import {SyncTarget} from '../../app/core/settings/settings';
import {PouchDbFsImagestore} from '../../app/core/imagestore/pouch-db-fs-imagestore';
import {PouchdbManager} from '../../app/core/datastore/core/pouchdb-manager';
import {Imagestore} from '../../app/core/imagestore/imagestore';
import * as PouchDB from 'pouchdb';
import {PouchdbDatastore} from '../../app/core/datastore/core/pouchdb-datastore';
import * as express from 'express';
import {RemoteChangesStream} from '../../app/core/datastore/core/remote-changes-stream';
import {DocumentCache} from '../../app/core/datastore/core/document-cache';
import {IdaiFieldDocument} from 'idai-components-2/src/model/idai-field-document';
import {IdaiFieldTypeConverter} from '../../app/core/datastore/field/idai-field-type-converter';
import {TypeUtility} from '../../app/core/model/type-utility';
import {IndexerConfiguration} from '../../app/indexer-configuration';
import {ViewFacade} from '../../app/components/resources/view/view-facade';
import {IdaiFieldDocumentDatastore} from '../../app/core/datastore/field/idai-field-document-datastore';
import {StandardStateSerializer} from '../../app/common/standard-state-serializer';
import {ConfigLoader, ConfigReader, IdaiFieldAppConfigurator} from 'idai-components-2';
import {FsConfigReader} from '../../app/core/util/fs-config-reader';
import {ResourcesStateManagerConfiguration} from '../../app/components/resources/view/resources-state-manager-configuration';

const expressPouchDB = require('express-pouchdb');
const cors = require('pouchdb-server/lib/cors');


describe('sync from remote to local db', () => {

    let syncTestSimulatedRemoteDb;
    let _remoteChangesStream;
    let _viewFacade;
    let server; // TODO close when done

    class IdGenerator {
        public generateId() {
            return Math.floor(Math.random() * 10000000).toString();
        }
    }


    async function createApp(pouchdbmanager, projectConfiguration, settingsService) {

        const {createdConstraintIndexer, createdFulltextIndexer, createdIndexFacade} =
            IndexerConfiguration.configureIndexers(projectConfiguration);

        const datastore = new PouchdbDatastore(
            pouchdbmanager.getDbProxy(),
            new IdGenerator(),
            true);

        const documentCache = new DocumentCache<IdaiFieldDocument>();

        const typeConverter = new IdaiFieldTypeConverter(new TypeUtility(projectConfiguration));

        const idaiFieldDocumentDatastore = new IdaiFieldDocumentDatastore(
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
            true
        );

        const viewFacade = new ViewFacade(
            projectConfiguration,
            idaiFieldDocumentDatastore,
            remoteChangesStream,
            resourcesStateManager,
            undefined
        );

        return {remoteChangesStream, viewFacade}
    }


    /**
     * Creates a db simulated to be on a remote machine
     */
    function setupSyncTestSimulatedRemoteDb() {

        return new Promise(resolve => {
            let app = express();
            let pouchDbApp = expressPouchDB(PouchDB);
            app.use(cors(pouchDbApp.couchConfig));
            app.use('/', pouchDbApp);
            server = app.listen(3003, function() {
                new PouchDB('synctestremotedb').destroy().then(() => {
                    resolve(new PouchDB('synctestremotedb'));
                });
            });
        }).then(newDb => syncTestSimulatedRemoteDb = newDb);
    }


    /**
     * Boot project via settings service such that it immediately starts syncinc with http://localhost:3003/synctestremotedb
     */
    async function setupSettingsService(pouchdbmanager) {

        const settingsService = new SettingsService(
            new PouchDbFsImagestore(
                undefined, undefined, pouchdbmanager.getDbProxy()) as Imagestore,
            pouchdbmanager,
            undefined,
            new IdaiFieldAppConfigurator(new ConfigLoader(new FsConfigReader() as ConfigReader)),
            undefined
        );

        await settingsService.bootProjectDb({
            isAutoUpdateActive: true,
            isSyncActive: true,
            remoteSites: [],
            syncTarget: new class implements SyncTarget {
                address: string = 'http://localhost:3003/';
                password: string;
                username: string;
            },
            dbs: ['synctest'],
            imagestorePath: '/tmp/abc',
            username: 'synctestuser'
        });

        const projectConfiguration = await settingsService.loadConfiguration('./config/');
        return {settingsService, projectConfiguration};
    }


    /**
     * Creates the db that is in the simulated client app
     */
    async function setupSyncTestDb() {

        let synctest = new PouchDB('synctest');
        await synctest.destroy();
        synctest = new PouchDB('synctest');
        await synctest.put({
            '_id': 'project',
            'resource': {
                'type': 'Project',
                'id': 'project',
                'identifier': 'synctest'
            }
        });
        await synctest.close();
    }


    const docToPut = {
        '_id': 'zehn',
        created: {"user": "sample_data", "date": "2018-09-11T20:46:15.408Z"},
        modified: [{"user": "sample_data", "date": "2018-09-11T20:46:15.408Z"}],
        resource: { type: 'Trench', id: 'zehn', identifier: 'Zehn', relations: {}}
    };


    beforeEach(async done => {

        await setupSyncTestSimulatedRemoteDb();
        await setupSyncTestDb();

        const pouchdbmanager = new PouchdbManager();
        const {settingsService, projectConfiguration} = await setupSettingsService(pouchdbmanager);

        const {remoteChangesStream, viewFacade} = await createApp(
            pouchdbmanager,
            projectConfiguration,
            settingsService
        );

        _remoteChangesStream = remoteChangesStream;
        _viewFacade = viewFacade;
        done();
    });


    afterEach(async done => {

        await server.close();
        done();
    });


    it('sync from remote to localdb', async done => {

        _remoteChangesStream.notifications().subscribe(async () => {

            await _viewFacade.selectView('project');
            await _viewFacade.populateDocumentList();
            const documents = await _viewFacade.getDocuments();

            expect(documents[0].resource.id).toEqual('zehn');
            await syncTestSimulatedRemoteDb.close();
            done();
        });

        await syncTestSimulatedRemoteDb.put(docToPut);
    });
});