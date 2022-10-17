import express from 'express';
import { Server } from 'http';
import PouchDB from 'pouchdb-node';
import { IdGenerator, PouchdbDatastore, SyncService, SyncStatus } from '../../../src/datastore';
import { doc } from '../../test-helpers';
import { Document } from '../../../src/model/document';

/**
 * @author Sebastian Cuy
 */
 xdescribe('SyncService', () => {


    const setup = async (port: number) => {

        console.log('setup');

        const app = express();
        app.use('/db', require('express-pouchdb')(PouchDB, { mode: 'minimumForPouchDB' }));
        const server = app.listen(port);
        
        const remoteDb = new PouchDB(`http://localhost:${port}/db/test_remote`);
        try {
            await remoteDb.put(doc('Test Find', 'Find 1', 'Find', '1'));
        } catch (err) {
            console.error(err);
        }

        const datastore = new PouchdbDatastore(name => new PouchDB(name), new IdGenerator());
        const localDb = await datastore.createDb('test_local', { _id: 'project' } as Document, null, true);
        const syncService = new SyncService(datastore);

        return { server, syncService, remoteDb, localDb };
    };


    const tearDown = async (server: Server, syncService: SyncService, remoteDb: PouchDB.Database, localDb: PouchDB.Database ) => {

        console.log('tearDown');
 
        syncService.stopSync();
        server.close();
        await remoteDb.destroy();
        await localDb.destroy();
    };

    xit('one-shot sync emits the correct status', async done => {

        try {

            const { server, syncService, remoteDb, localDb } = await setup(30001);

            const status = syncService.statusNotifications();
            
            syncService.init('http://localhost:30001/db', 'test_remote', '', async () => true);
            syncService.startSync();

            let count = 0;
            status.subscribe(s => {
                count++;
                console.log('s1', s);
                if (count === 1) expect(s).toBe(SyncStatus.Pulling);
                if (count === 2) {
                    expect(s).toBe(SyncStatus.InSync);
                    done();
                }
            });

        } catch(err) {
            fail(err);
            console.error(err);
        }
    });

    xit('live sync emits the correct status', async done => {

        // TODO: does not work as expected
        // stays in status IN_SYNC after putting second Find
        // and keeps producing errors even after syncing is stopped in tearDown()

        try {

            const { server, syncService, remoteDb, localDb } = await setup(30002);

            const status = syncService.statusNotifications();
            
            syncService.init('http://localhost:30002/db', 'test_remote', '', async () => true);
            syncService.startSync();

            let count = 0;
            await new Promise<void>(resolve => status.subscribe(s => {
                count++;
                console.log('s2', s);
                if (count === 2) {
                    expect(s).toBe(SyncStatus.InSync);
                    resolve();
                }
                if (count === 5) {
                    expect(s).toBe(SyncStatus.InSync);
                    tearDown(server, syncService, remoteDb, localDb);
                    done();
                }
            }));

            await remoteDb.put(doc('Another Test Find', 'Find 2', 'Find', '2'));

        } catch(err) {
            fail(err);
            console.error(err);
        }
    });

 });
