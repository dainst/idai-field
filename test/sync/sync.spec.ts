import * as PouchDB from 'pouchdb';
import * as express from 'express';
import {createApp, setupSyncTestDb} from '../subsystem/subsystem-helper';

const expressPouchDB = require('express-pouchdb');
const cors = require('pouchdb-server/lib/cors');


xdescribe('sync from remote to local db', () => {

    let syncTestSimulatedRemoteDb;
    let _remoteChangesStream;
    let _documentHolder;
    let _viewFacade;
    let server; // TODO close when done
    let rev;

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


    const docToPut = {
        '_id': 'zehn',
        created: {"user": "sample_data", "date": "2018-09-11T20:46:15.408Z"},
        modified: [{"user": "sample_data", "date": "2018-09-11T20:46:15.408Z"}],
        resource: { type: 'Trench', id: 'zehn', identifier: 'Zehn', relations: {}}
    };


    beforeAll(async done => {

        await setupSyncTestSimulatedRemoteDb();
        await setupSyncTestDb('synctestdb');

        const {remoteChangesStream, viewFacade, documentHolder} =
            await createApp('synctest', true);

        _documentHolder = documentHolder;
        _remoteChangesStream = remoteChangesStream;
        _viewFacade = viewFacade;
        done();
    });


    afterAll(async done => {

        await server.close();
        await syncTestSimulatedRemoteDb.close();
        done();
    });


    it('sync from remote to localdb', async done => {

        let d = false;
        _remoteChangesStream.notifications().subscribe(async () => {

            await _viewFacade.selectView('project');
            await _viewFacade.populateDocumentList();
            const documents = await _viewFacade.getDocuments();

            // TODO test that it is marked as new from remote, and existing item is not new from remote

            if (!d) {
                expect(documents[0].resource.id).toEqual('zehn');
                d = true;
                done();
            }
        });

        rev = (await syncTestSimulatedRemoteDb.put(docToPut)).rev;
    });


    it('sync modified from remote to localdb', async done => {

        let d = false;
        _remoteChangesStream.notifications().subscribe(async () => {

            await _viewFacade.selectView('project');
            await _viewFacade.populateDocumentList();
            const documents = await _viewFacade.getDocuments();

            // TODO test that it is marked as new from remote, and existing item is not new from remote

            if (!d) {
                expect(documents[0].resource.identifier).toEqual('Zehn!');
                d = true;
                done();
            }
        });

        docToPut['_rev'] = rev;
        docToPut.resource.identifier = 'Zehn!';
        await syncTestSimulatedRemoteDb.put(docToPut, {force: true});
    });


    it('sync to remote db', async done => {

        syncTestSimulatedRemoteDb.changes({
            live: true,
            include_docs: true, // we do this and fetch it later because there is a possible leak, as reported in https://github.com/pouchdb/pouchdb/issues/6502
            conflicts: true,
            since: 'now'
        }).on('change', (change: any) => {

            expect(change.doc.resource.identifier).toEqual('Elf');
            done();
        });


        const docToPut = {
            created: {"user": "sample_data", "date": "2018-09-11T20:46:15.408Z"},
            modified: [{"user": "sample_data", "date": "2018-09-11T20:46:15.408Z"}],
            resource: { type: 'Trench', identifier: 'Elf', relations: {}}
        };
        _documentHolder.setClonedDocument(docToPut);
        await _documentHolder.save(true);
    });
});