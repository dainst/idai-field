import {SettingsService} from '../../app/core/settings/settings-service';
import {Settings, SyncTarget} from '../../app/core/settings/settings';
import {PouchDbFsImagestore} from '../../app/core/imagestore/pouch-db-fs-imagestore';
import {PouchdbManager} from '../../app/core/datastore/core/pouchdb-manager';
import {Imagestore} from '../../app/core/imagestore/imagestore';
import * as PouchDB from 'pouchdb';
import {PouchdbDatastore} from '../../app/core/datastore/core/pouchdb-datastore';
import * as express from 'express';
import {ConstraintIndexer} from '../../app/core/datastore/index/constraint-indexer';
import {FulltextIndexer} from '../../app/core/datastore/index/fulltext-indexer';
import {RemoteChangesStream} from '../../app/core/datastore/core/remote-changes-stream';
import {IndexFacade} from '../../app/core/datastore/index/index-facade';
import {DocumentCache} from '../../app/core/datastore/core/document-cache';
import {IdaiFieldDocument} from 'idai-components-2/src/model/idai-field-document';
import {IdaiFieldTypeConverter} from '../../app/core/datastore/field/idai-field-type-converter';
import {TypeUtility} from '../../app/core/model/type-utility';
import {ProjectConfiguration} from 'idai-components-2/src/configuration/project-configuration';

const expressPouchDB = require('express-pouchdb');
const cors = require('pouchdb-server/lib/cors');


describe('sync', () => {

    let syncTestSimulatedRemoteDb;
    let server;

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


    function createIndexers(projectConfiguration) {

        const constraintIndexer = new ConstraintIndexer({
            'isRecordedIn:contain': { path: 'resource.relations.isRecordedIn', type: 'contain' },
            'liesWithin:contain': { path: 'resource.relations.liesWithin', type: 'contain' },
            'liesWithin:exist': { path: 'resource.relations.liesWithin', type: 'exist' },
            'identifier:match': { path: 'resource.identifier', type: 'match' },
            'id:match': { path: 'resource.id', type: 'match' }
        }, projectConfiguration, false);
        const fulltextIndexer = new FulltextIndexer(projectConfiguration, false);
        return [constraintIndexer, fulltextIndexer] as [ConstraintIndexer, FulltextIndexer];
    }


    class UsernameProvider {

        getUsername = () => 'fakeuser';
    }

    async function createRemoteChangesStream(pouchdbmanager, projectConfiguration) {

        const [constraintIndexer, fulltextIndexer] = createIndexers(projectConfiguration);

        return new RemoteChangesStream(
            new PouchdbDatastore(
                pouchdbmanager.getDbProxy(),
                new IdGenerator(),
                true),
            new IndexFacade(constraintIndexer, fulltextIndexer),
            new DocumentCache<IdaiFieldDocument>(),
            new IdaiFieldTypeConverter(new TypeUtility(projectConfiguration)),
            new UsernameProvider());
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

        const pouchDbFsImagestore = new PouchDbFsImagestore(
            undefined, undefined, pouchdbmanager.getDbProxy()) as Imagestore;

        const settingsService = new SettingsService(
            pouchDbFsImagestore,
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


    function createDocToPut() {

        return {'_id': 'zehn',
            created: {
            "user": "sample_data",
                "date": "2018-09-11T20:46:15.408Z"
        },
        modified: [
            {
                "user": "sample_data",
                "date": "2018-09-11T20:46:15.408Z"
            }
        ],
        resource: { type: 'Object', id: 'zehn', identifier: 'Zehn', relations: {}}}
    }


    it('sync from remote to localdb', async done => {

        await setupSyncTestSimulatedRemoteDb();
        await setupSyncTestDb();
        const pouchdbmanager = new PouchdbManager();
        await setupSettingsService(pouchdbmanager);

        (await createRemoteChangesStream( // TODO simulate view facade instead
            pouchdbmanager,
            projectConfiguration // TODO get that one from settings service
        )).notifications().subscribe((changes: any) => {

            return syncTestSimulatedRemoteDb.close().then(() => done());
        });

        await syncTestSimulatedRemoteDb.put(createDocToPut());
    });
});