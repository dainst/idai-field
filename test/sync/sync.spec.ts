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
import {ProjectConfiguration} from 'idai-components-2/src/configuration/project-configuration';
import {IndexerConfiguration} from '../../app/indexer-configuration';
import {ViewFacade} from '../../app/components/resources/view/view-facade';
import {IdaiFieldDocumentDatastore} from '../../app/core/datastore/field/idai-field-document-datastore';
import {ResourcesStateManager} from '../../app/components/resources/view/resources-state-manager';
import {ViewDefinition} from '../../app/components/resources/view/state/view-definition';
import {OperationViews} from '../../app/components/resources/view/state/operation-views';
import {StandardStateSerializer} from '../../app/common/standard-state-serializer';

const expressPouchDB = require('express-pouchdb');
const cors = require('pouchdb-server/lib/cors');


describe('sync', () => {

    let syncTestSimulatedRemoteDb;
    let server; // TODO close when done

    class IdGenerator {
        public generateId() {
            return Math.floor(Math.random() * 10000000).toString();
        }
    }

    const projectConfiguration = new ProjectConfiguration({
        'types': [
            {
                'type': 'Trench',
                'fields': []
            },
            {
                'type': 'Object',
                'fields': []
            }
        ]
    });


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

        const views: ViewDefinition[] = [ // TODO remove duplicate code
            {
                "label": "Ausgrabung",
                "name": "excavation",
                "operationSubtype": "Trench"
            },
            {
                "label": "Bauaufnahme",
                "name": "Building",
                "operationSubtype": "Building"
            },
            {
                "label": "Survey",
                "name": "survey",
                "operationSubtype": "Survey"
            }
        ];

        const resourcesStateManager = new ResourcesStateManager(
            idaiFieldDocumentDatastore,
            new StandardStateSerializer(settingsService),
            new OperationViews(views),
            ['Place'],
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
            undefined,
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

        return settingsService;
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
        resource: { type: 'Object', id: 'zehn', identifier: 'Zehn', relations: {}}
    };



    it('sync from remote to localdb', async done => {

        await setupSyncTestSimulatedRemoteDb();
        await setupSyncTestDb();
        const pouchdbmanager = new PouchdbManager();
        const settingsService = await setupSettingsService(pouchdbmanager);


        const {remoteChangesStream, viewFacade} = await createApp(
            pouchdbmanager,
            projectConfiguration, // TODO get that one from settings service
            settingsService
        );

        await viewFacade.selectView('excavation');

        remoteChangesStream.notifications().subscribe(async (changes: any) => {

            expect(changes.resource.id).toEqual('zehn');
            // console.log(":", await viewFacade.getDocuments());
            return syncTestSimulatedRemoteDb.close().then(() => done());
        });

        await syncTestSimulatedRemoteDb.put(docToPut);
    });
});