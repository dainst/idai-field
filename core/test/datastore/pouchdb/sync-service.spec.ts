import express from 'express';
import { Server } from 'http';
import PouchDB from 'pouchdb-node';
import { IdGenerator, PouchdbDatastore, SyncService, SyncStatus } from '../../../src/datastore';
import { doc } from '../../test-helpers';

/**
 * @author Sebastian Cuy
 */
 describe('SyncService', () => {

    let server: Server;
    let app: express.Application;
    let remoteDb: PouchDB.Database;
    let localDb: PouchDB.Database;
    let datastore: PouchdbDatastore;
    let syncService: SyncService;


    beforeEach(async done => {

        try {

            app = express();
            app.use('/db', require('express-pouchdb')(PouchDB, { mode: 'minimumForPouchDB' }));
            server = app.listen(3333);
            remoteDb = new PouchDB('test_remote');

            expect((await new PouchDB('http://localhost:3333/db/test_remote').info())['db_name']).toEqual('test_remote');

            await remoteDb.put(doc('Test Find', 'Find 1', 'Find', '1'));
            const d: any = await remoteDb.get('1');
            expect(d.resource.shortDescription).toEqual('Test Find');

            datastore = new PouchdbDatastore(name => new PouchDB(name), new IdGenerator());
            localDb = await datastore.createDb('test_local', { _id: 'project' }, true);
            syncService = new SyncService(datastore);

        } catch (err) {
            console.log('Error when setting up test db', err);
        }

        done();
    });


    afterEach(async done => {

        try {
            server.close();
            await remoteDb.destroy();
            await localDb.destroy();
        } catch (err) {
            console.log('Error when destroying test db', err);
        }

        done();
    });

    it('one-shot sync ends with status IN_SYNC', async done => {

        try {

            const status = syncService.statusNotifications();
            
            syncService.init('http://localhost:3333/db', 'test_remote', '');
            syncService.startSync(false);

            let count = 0;
            status.subscribe(s => {
                console.log({ s })
                if (count === 0) expect(s).toBe(SyncStatus.Pulling);
                if (count === 1) {
                    expect(s).toBe(SyncStatus.InSync);
                    done();
                }
                count++;
            });

        } catch(err) {
            console.log(err);
            fail();
        }
    });

 });
